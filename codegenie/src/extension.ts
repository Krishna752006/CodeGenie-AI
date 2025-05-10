import * as vscode from 'vscode';
import { fetchAICompletion } from "./codegenie-ui/src/api";
import { CodeGenieViewProvider } from "./CodeGenieViewProvider";

let isOnline = false;
let EXTENSION_STATUS = true;
let inlineSuggestionRequested = false;
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
        vscode.window.showWarningMessage("CodeGenie Disabled");
        updateStatusBar();
    });

    let generateFromComment = vscode.commands.registerCommand('codegenie.generateFromComment', async () => {
        if (!EXTENSION_STATUS) {
            vscode.window.showErrorMessage("CodeGenie disabled.");
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a file to use CodeGenie.');
            return;
        }

        const document = editor.document;

        const lastComment = findLastComment(document);
         if (!lastComment) {
             vscode.window.showErrorMessage("No comment found.");
             return;
         }
         await generateCodeFromPrompt(editor, lastComment);
    });

    let triggerInlineCompletion = vscode.commands.registerCommand('codegenie.triggerInlineCompletion', async () => {
        inlineSuggestionRequested = true;
        await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    });

    context.subscriptions.push(generateCode, generateFromComment,triggerInlineCompletion, enableCodeGenie, disableCodeGenie);

    const inlineProvider: vscode.InlineCompletionItemProvider = {
        provideInlineCompletionItems: async (
            document: vscode.TextDocument,
            position: vscode.Position,
            context: vscode.InlineCompletionContext,
            token: vscode.CancellationToken
        ): Promise<vscode.InlineCompletionItem[]> => {
            // Check if the extension is enabled
            if (!EXTENSION_STATUS) return [];
            
            if (!inlineSuggestionRequested) return [];
            inlineSuggestionRequested = false; 

            let textBeforeCursor = document.getText(new vscode.Range(position.with(undefined, 0), position)).trim();
            if (!textBeforeCursor) {
                for (let line = position.line - 1; line >= 0; line--) {
                    let prevLineText = document.lineAt(line).text.trim();
                    if (prevLineText.length > 0) {
                        textBeforeCursor = prevLineText;
                        break;
                    }
                }
            }

            if (!textBeforeCursor) return [];

            try {
                console.log("🔵 Code Generating for (prompt):", textBeforeCursor);
                statusBarItem.text = "$(sync~spin) CodeGenie: Generating...";
    
                // Fetch the AI response based on the prompt text
                let rawResponse = await fetchAICompletion(textBeforeCursor, isOnline);
                let aiResponse = removeQueryFromResponse(rawResponse, textBeforeCursor); 
    
                if (!aiResponse || aiResponse.trim() === "") {
                    statusBarItem.text = "$(alert) CodeGenie: No response";
                    return [];
                }
    
                console.log("🧠 AI Response:", aiResponse);
                statusBarItem.text = "$(check) CodeGenie: Ready";
    
                // Return the completion suggestion
                return [
                    new vscode.InlineCompletionItem(
                        new vscode.SnippetString(`\n${aiResponse}`),
                        new vscode.Range(position, position)
                    )
                ];
            } catch (error) {
                console.error("Code-Generation Error:", error);
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
        const rawResponse = await fetchAICompletion(prompt, isOnline);
        const cleanedResponse = removeQueryFromResponse(rawResponse, prompt);
        const aiResponse = extractOnlyCode(cleanedResponse);

        if (aiResponse === "") {
            throw new Error("No response from AI backend");
        }

        editor.edit(editBuilder => { // Edits the Editor by inserting it there
            editBuilder.insert(editor.selection.active, `\n${aiResponse}\n`); //Inserts at the cursor location in the editor
        });

        vscode.window.showInformationMessage("✅ Code inserted!");
        updateStatusBar();
    } catch (error) {
        vscode.window.showErrorMessage("Error generating code.");
        statusBarItem.text = "$(error) CodeGenie: Error";
    }
}

function removeQueryFromResponse(response: string, query: string): string {
    const trimmedQuery = query.trim();
    let cleaned = response.trim();

    if (cleaned.startsWith(trimmedQuery)) {
        cleaned = cleaned.slice(trimmedQuery.length).trimStart();
        if (cleaned.startsWith('\n')) {
            cleaned = cleaned.slice(1);
        }
    }
    return cleaned;
}

function extractOnlyCode(response: string): string {
    const codeBlockRegex = /```(?:[\w]*)\n([\s\S]*?)```/g;
        let match;
        const codeBlocks = [];
    
        while ((match = codeBlockRegex.exec(response)) !== null) {
            codeBlocks.push(match[1].trim());
        }

        if (codeBlocks.length > 0) {
            return codeBlocks.join('\n\n');
        }

        return response
            .split('\n')
            .map(line => line.trim())
            .filter(line =>
                line &&
                !line.startsWith('#') &&
                !line.startsWith('//') &&
                !/^(Note|This|Explanation|For example|A more efficient solution|Here is|In this|To solve)/i.test(line)
            )
            .join('\n')
            .trim();
}

function findLastComment(document: vscode.TextDocument): string | null {
    for (let i = document.lineCount - 1; i >= 0; i--) {
        const text = document.lineAt(i).text.trim();
        if (text.startsWith("//") || text.startsWith("#")) {
            return text.replace(/^[/#]+/, "").trim();
        }
    }
    return null;
}

function updateStatusBar() {
    statusBarItem.text = EXTENSION_STATUS ? "$(check) CodeGenie: Ready" : "$(x) CodeGenie: Disabled";
}

export function deactivate() {
    console.log("🛑 CodeGenie Extension Deactivated");
    statusBarItem.dispose();
}