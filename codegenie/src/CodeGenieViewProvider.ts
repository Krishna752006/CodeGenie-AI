import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class CodeGenieViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codegenieView"; //This line is just the id of the webview and just used by package.json to identify the file
  public _view?: vscode.WebviewView; //Stores the actual Webview instance

  constructor(private readonly context: vscode.ExtensionContext) {} //Context helps TypeScript access other folders but it also provides storage, lifecycle management, and utilities for building a clean extension.

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext,_token: vscode.CancellationToken)
  {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true, // Allows JavaScript to run in Web view
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, "src", "codegenie-ui", "build")), // The WebView is allowed to load files from src/codegenie-ui/build folder 
      ],
    };

    const webviewDistPath = path.join(this.context.extensionPath, "src", "codegenie-ui", "build"); // Builds absolute file paths to your Webview's frontend files
    const indexPath = path.join(webviewDistPath, "index.html"); // This creates the full path to the index.html file

    try {
      let html = fs.readFileSync(indexPath, "utf8"); // Reads the content in file. "utf8" means in the form of text and not bytes.
      
      if (!html.includes('Content-Security-Policy')) { // Ads the meta data cunsorning to Security Issues
        html = html.replace(
          /<head>/i,
          `<head>
            <meta http-equiv="Content-Security-Policy" 
                  content="default-src 'none'; 
                          connect-src http://127.0.0.1:8000 http://<rtx-4050-server-ip>:8000 vscode-resource:; 
                          img-src vscode-resource: https:; 
                          script-src vscode-resource: 'unsafe-inline'; 
                          style-src vscode-resource: 'unsafe-inline'; 
                          font-src vscode-resource:;">
          `
        );
      }

      html = html.replace(/(src|href)="(?!https?:\/\/)(.*?)"/g, (match, attr, src) => { // Finds all the local files which are in src or href i.e. not http or https and gets their file path into match, src or href into attr and resource path into src.
        const resourceUri = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(webviewDistPath, src))); // Converts these files into vscode resource so that they can easily be loaded without any trouble
        return `${attr}="${resourceUri}"`; // returns like src="vscode-resource://extension-folder/main.js"
      });

      webviewView.webview.html = html;

      webviewView.webview.onDidReceiveMessage(async (message) => {
        if (message.type === "insertCode") {
          try {
          
          let editor = vscode.window.activeTextEditor; // Try to get the last active text editor

          if (!editor) {
            vscode.window.showErrorMessage("No active editor. Please open a file to insert code.");
            return;
          }
          
          await vscode.window.showTextDocument(editor.document, editor.viewColumn, false); // Always focus the editor before inserting

          
          setTimeout(async () => { // Wait a tick for focus to update
            
            editor = vscode.window.activeTextEditor; // Get the (now) active editor again
            if (!editor) {
              vscode.window.showErrorMessage("No active editor after focusing.");
              return;
            }

            const success = await editor.edit(editBuilder => {
              editBuilder.insert(editor!.selection.active, message.code);
            });

            if (!success) {
              vscode.window.showErrorMessage("Failed to insert code. Please try again.");
            }
          }, 10); // 10ms delay to ensure focus
        } catch (err: any) {
          vscode.window.showErrorMessage("Error inserting code: " + err.message);
        }
      }
      });

    } catch (error: any) {
      console.error("❌ Failed to load Webview:", error);
      webviewView.webview.html = `<h1>Error loading UI</h1><p>${error.message}</p>`;
    }
  }
}