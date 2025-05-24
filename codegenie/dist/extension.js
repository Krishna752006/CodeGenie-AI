"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./codegenie-ui/src/api");
const CodeGenieViewProvider_1 = require("./CodeGenieViewProvider");
let isOnline = false;
let EXTENSION_STATUS = true;
const debugOutputChannel = vscode.window.createOutputChannel("CodeGenie Debug");
let inlineSuggestionRequested = false;
let statusBarItem;
let provider;
function activate(context) {
    console.log("✅ CodeGenie Extension Activated!");
    provider = new CodeGenieViewProvider_1.CodeGenieViewProvider(context);
    context.subscriptions.push(// It registers the object (like a command, view, etc.) and cleans the data related to them when we reload, disable/uninstall extension or quit VS code.
    vscode.window.registerWebviewViewProvider(CodeGenieViewProvider_1.CodeGenieViewProvider.viewType, provider) //This automatically load resolveWebviewView method inside of CodeGenieViewProvider
    );
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left); // Creates a Status Bar Item to the left side
    updateStatusBar();
    statusBarItem.show(); // It tells the VS Code to Display the Statusbar item.
    let generateCode = vscode.commands.registerCommand('codegenie.getCode', () => __awaiter(this, void 0, void 0, function* () {
        if (!EXTENSION_STATUS) {
            vscode.window.showErrorMessage(" CodeGenie is disabled.");
            return;
        }
        const editor = vscode.window.activeTextEditor; // Gets the file in which the generated code will be pasted
        if (!editor) {
            vscode.window.showErrorMessage(' Open a file to use CodeGenie.');
            return;
        }
        const prompt = yield vscode.window.showInputBox({ prompt: 'Enter your AI prompt' });
        if (!prompt)
            return;
        yield generateCodeFromPrompt(editor, prompt);
    }));
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
    let generateFromComment = vscode.commands.registerCommand('codegenie.generateFromComment', () => __awaiter(this, void 0, void 0, function* () {
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
        yield generateCodeFromPrompt(editor, lastComment);
    }));
    let triggerInlineCompletion = vscode.commands.registerCommand('codegenie.triggerInlineCompletion', () => __awaiter(this, void 0, void 0, function* () {
        inlineSuggestionRequested = true;
        yield vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    }));
    let debugSelectedCode = vscode.commands.registerCommand('codegenie.debugSelectedCode', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a file to use CodeGenie.');
            return;
        }
        const selection = editor.selection;
        const code = editor.document.getText(selection);
        if (!code.trim()) {
            vscode.window.showWarningMessage('Please select some code to debug.');
            return;
        }
        statusBarItem.text = "$(sync~spin) CodeGenie: Debugging...";
        try {
            const response = yield fetch('http://127.0.0.1:8000/debug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: code, max_tokens: 1000 })
            });
            const result = yield response.json();
            debugOutputChannel.clear();
            if (result.response) {
                vscode.window.showInformationMessage(result.response);
                debugOutputChannel.appendLine(result.response);
                debugOutputChannel.show(true);
                statusBarItem.text = "$(check) CodeGenie: Ready";
            }
            else {
                debugOutputChannel.appendLine("No debug info received.");
                debugOutputChannel.show(true);
                statusBarItem.text = "$(alert) CodeGenie: No response";
            }
        }
        catch (error) {
            debugOutputChannel.appendLine(`Error debugging code: ${error}`);
            debugOutputChannel.show(true);
            statusBarItem.text = "$(error) CodeGenie: Error";
        }
    }));
    context.subscriptions.push(generateCode, generateFromComment, triggerInlineCompletion, debugSelectedCode, enableCodeGenie, disableCodeGenie);
    const inlineProvider = {
        provideInlineCompletionItems: (document, position, context, token) => __awaiter(this, void 0, void 0, function* () {
            // Check if the extension is enabled
            if (!EXTENSION_STATUS)
                return [];
            if (!inlineSuggestionRequested)
                return [];
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
            if (!textBeforeCursor)
                return [];
            try {
                console.log("🔵 Code Generating for (prompt):", textBeforeCursor);
                statusBarItem.text = "$(sync~spin) CodeGenie: Generating...";
                // Fetch the AI response based on the prompt text
                let rawResponse = yield (0, api_1.fetchAICompletion)(textBeforeCursor, isOnline);
                let aiResponse = removeQueryFromResponse(rawResponse, textBeforeCursor);
                if (!aiResponse || aiResponse.trim() === "") {
                    statusBarItem.text = "$(alert) CodeGenie: No response";
                    return [];
                }
                console.log("🧠 AI Response:", aiResponse);
                statusBarItem.text = "$(check) CodeGenie: Ready";
                // Return the completion suggestion
                return [
                    new vscode.InlineCompletionItem(new vscode.SnippetString(`\n${aiResponse}`), new vscode.Range(position, position))
                ];
            }
            catch (error) {
                console.error("Code-Generation Error:", error);
                statusBarItem.text = "$(error) CodeGenie: Error";
                return [];
            }
        })
    };
    // Register the inline provider
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, inlineProvider);
}
exports.activate = activate;
function generateCodeFromPrompt(editor, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.window.showInformationMessage("✨ Generating Code...");
        statusBarItem.text = "$(sync~spin) CodeGenie: Generating...";
        try {
            const rawResponse = yield (0, api_1.fetchAICompletion)(prompt, isOnline);
            const cleanedResponse = removeQueryFromResponse(rawResponse, prompt);
            const aiResponse = extractOnlyCode(cleanedResponse);
            if (aiResponse === "") {
                throw new Error("No response from AI backend");
            }
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, `\n${aiResponse}\n`); //Inserts at the cursor location in the editor
            });
            vscode.window.showInformationMessage("✅ Code inserted!");
            updateStatusBar();
        }
        catch (error) {
            vscode.window.showErrorMessage("Error generating code.");
            statusBarItem.text = "$(error) CodeGenie: Error";
        }
    });
}
function removeQueryFromResponse(response, query) {
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
function extractOnlyCode(response) {
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
        .filter(line => line &&
        !line.startsWith('#') &&
        !line.startsWith('//') &&
        !/^(Note|This|Explanation|For example|A more efficient solution|Here is|In this|To solve)/i.test(line))
        .join('\n')
        .trim();
}
function findLastComment(document) {
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
function deactivate() {
    console.log("🛑 CodeGenie Extension Deactivated");
    statusBarItem.dispose();
}
exports.deactivate = deactivate;
