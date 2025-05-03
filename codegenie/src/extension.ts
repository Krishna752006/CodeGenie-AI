import * as vscode from 'vscode';
import axios from "axios";
import { CodeGenieViewProvider } from "./CodeGenieViewProvider";

let EXTENSION_STATUS = true;
let statusBarItem: vscode.StatusBarItem;
let provider: CodeGenieViewProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log("✅ CodeGenie Extension Activated!");

    provider = new CodeGenieViewProvider(context);
    context.subscriptions.push( // It registers the object (like a command, view, etc.) and cleans the data related to them when we reload, disable/uninstall extension or quit VS code.
        vscode.window.registerWebviewViewProvider(CodeGenieViewProvider.viewType, provider) //This automatically load resolveWebviewView method inside of CodeGenieViewProvider
    );

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left); // Creates a Status Bar Item to the left side
    updateStatusBar(); // Below Function is there
    statusBarItem.show(); // It tells the VS Code to Display the Statusbar item.

    let generateCode = vscode.commands.registerCommand('codegenie.getCode', async () => { // This will generate code and put inside an open file
        if (!EXTENSION_STATUS) {
            vscode.window.showErrorMessage(" CodeGenie is disabled.");
            return;
        }

        const editor = vscode.window.activeTextEditor; // Gets the file in which the generated code will be pasted
        if (!editor) {
            vscode.window.showErrorMessage(' Open a file to use CodeGenie.');
            return;
        }

        const prompt = await vscode.window.showInputBox({ prompt: 'Enter your AI prompt' });
        if (!prompt) return;

        await generateCodeFromPrompt(editor, prompt);
    });

    let enableCodeGenie = vscode.commands.registerCommand('codegenie.enableCodeGenie', () => {
        EXTENSION_STATUS = true;
        vscode.window.showInformationMessage("✅ CodeGenie Enabled");
        updateStatusBar();
    });

    let disableCodeGenie = vscode.commands.registerCommand('codegenie.disableCodeGenie', () => {
        EXTENSION_STATUS = false;
        vscode.window.showWarningMessage("🛑 CodeGenie Disabled");
        updateStatusBar();
    });

    context.subscriptions.push(generateCode, enableCodeGenie, disableCodeGenie);

    const inlineProvider: vscode.InlineCompletionItemProvider = {
        provideInlineCompletionItems: async (document, position, context) => {
            // Check if the extension is enabled
            if (!EXTENSION_STATUS) return [];
    
            // Check if the completion was triggered manually (e.g., Ctrl+Space)
            if (context.triggerKind !== vscode.InlineCompletionTriggerKind.Invoke) {
                return []; // No autocomplete if not invoked manually
            }
    
            // Ensure we don't complete on the first line
            if (position.line === 0) return [];
    
            // Get the current line and previous line text
            const currentLine = document.lineAt(position.line).text.substring(0, position.character);
            const promptText = `${document.lineAt(position.line - 1).text.trim()} ${currentLine}`.trim();
    
            // If there's no prompt text, return an empty array
            if (!promptText) return [];
    
            try {
                console.log("🔵 Code Generating for (prompt):", promptText);
                statusBarItem.text = "$(sync~spin) CodeGenie: Generating...";
    
                // Fetch the AI response based on the prompt text
                const aiResponse = await fetchAICompletion(promptText);
    
                if (!aiResponse || aiResponse.trim() === "") {
                    statusBarItem.text = "$(alert) CodeGenie: No response";
                    return [];
                }
    
                console.log("🧠 AI Response:", aiResponse);
                statusBarItem.text = "$(check) CodeGenie: Ready";
    
                // Check if the AI response starts with the current line (to avoid re-suggesting the same text)
                const completionText = aiResponse.startsWith(currentLine)
                    ? aiResponse.slice(currentLine.length)
                    : aiResponse;
    
                // If there's no new suggestion, return an empty array
                if (!completionText.trim()) {
                    console.log("🟡 No new suggestion to offer");
                    return [];
                }
    
                // Return the completion suggestion
                return [
                    new vscode.InlineCompletionItem(
                        new vscode.SnippetString(completionText),
                        new vscode.Range(position, position)
                    )
                ];
            } catch (error) {
                console.error("❌ Code-Generation Error:", error);
                statusBarItem.text = "$(error) CodeGenie: Error";
                return [];
            }
        }
    };
    
    // Register the inline provider
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, inlineProvider);    
}

async function generateCodeFromPrompt(editor: vscode.TextEditor, prompt: string) {
    vscode.window.showInformationMessage("✨ Generating Code...");
    statusBarItem.text = "$(sync~spin) CodeGenie: Generating...";

    try {
        const aiResponse = await fetchAICompletion(prompt);

        if (aiResponse === "") {
            throw new Error("No response from AI backend");
        }

        editor.edit(editBuilder => { // Edits the Editor by inserting it there
            editBuilder.insert(editor.selection.active, `\n${aiResponse}\n`); //Inserts at the cursor location in the editor
        });

        vscode.window.showInformationMessage("✅ Code inserted!");
        updateStatusBar();
    } catch (error) {
        vscode.window.showErrorMessage("❌ Error generating code.");
        statusBarItem.text = "$(error) CodeGenie: Error";
    }
}

async function fetchAICompletion(prompt: string): Promise<string> { // Promise for type safety. It basically says "I promise to give you a string, just wait a moment."
    const raw = await fetchAICompletionRaw(prompt);
    return extractOnlyCode(raw);
}

async function fetchAICompletionRaw(prompt: string): Promise<string> {
    try {
        const response = await axios.post("http://127.0.0.1:8000/generate", {
            prompt,
            max_tokens: 10000
        });

        let aiResponse = response.data.response || ""; // If the AI data is undefined, null, false, 0 or nan, it changes to Empty String i.e. ""
        if (aiResponse.startsWith(prompt)) {
            aiResponse = aiResponse.replace(prompt, "");
        }
        return aiResponse.trim();
    } catch (error) {
        console.error("❌ Fetch Error:", error);
        return "";
    }
}

function extractOnlyCode(response: string): string {
    const match = response.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
    if (match) return match[1].trim(); // If the code is present in ''' like in python comments, it removes the uneccessary parts and returns the code.

    return response.split("\n") // If Code is not present in python like comments.
        .filter(line => {
            const trimmed = line.trim();
            return (
                trimmed &&
                !trimmed.startsWith("//") &&
                !trimmed.startsWith("#") &&
                !trimmed.startsWith("*") &&
                !/^(Note|This|Explanation|To solve|In this)/i.test(trimmed)
            );
        })
        .join("\n")
        .trim();
}

function updateStatusBar() {
    statusBarItem.text = EXTENSION_STATUS ? "$(check) CodeGenie: Ready" : "$(x) CodeGenie: Disabled";
}

export function deactivate() {
    console.log("🛑 CodeGenie Extension Deactivated");
    statusBarItem.dispose();
}

/*
For Later Use

let generateFromComment = vscode.commands.registerCommand('codegenie.generateFromComment', async () => {
        if (!EXTENSION_STATUS) {
            vscode.window.showErrorMessage("❌ Autocomplete is disabled.");
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('❌ Open a file to use CodeGenie.');
            return;
        }

        const document = editor.document;
        const lastComment = findLastComment(document);
        if (!lastComment) {
            vscode.window.showErrorMessage("❌ No comment found.");
            return;
        }

        await generateCodeFromPrompt(editor, lastComment);

function findLastComment(document: vscode.TextDocument): string | null {
    for (let i = document.lineCount - 1; i >= 0; i--) {
        const text = document.lineAt(i).text.trim();
        if (text.startsWith("//") || text.startsWith("#")) {
            return text.replace(/^[/#]+/, "").trim();
        }
    }
    return null;
}

*/