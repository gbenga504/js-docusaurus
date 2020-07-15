// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let diagnosticCollection: vscode.DiagnosticCollection;
	diagnosticCollection = vscode.languages.createDiagnosticCollection("javascript");

	function CheckFileDiagnotics(document: vscode.TextDocument) {
		diagnosticCollection.clear();
		let diagnotics: vscode.Diagnostic[] = []
		Array.apply(null, Array(document.lineCount)).forEach((value: any, index: number) => {
			let text: string = document.lineAt(index).text;
			let regex: RegExp = /function [a-z_]+\(\S*\){\s*/;
			let match: RegExpExecArray | null = regex.exec(text);
			if (match !== null) {
				let functionName = (match[0].match(/function [a-z_]+/) || [])[0]
				diagnotics.push(new vscode.Diagnostic(
					new vscode.Range(index, match.index, index, (match.index + match[0].length) - 1),
					`${functionName} should have comment`,
					vscode.DiagnosticSeverity.Warning
				))
			}
		})
		diagnosticCollection.set(document.uri, diagnotics);

		//unnecessary using document.uri is enough
		// console.log(vscode.Uri.parse(document.uri.fsPath))
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "js-docusaurus" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('js-docusaurus.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from js-docusaurus!');
	});

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		if (document.languageId === "typescript" || document.languageId === "javascript") {
			CheckFileDiagnotics(document)
		}
	})

	vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		if (document.languageId === "typescript" || document.languageId === "javascript") {
			CheckFileDiagnotics(document)
		}
	})

	context.subscriptions.push(
		disposable,
		diagnosticCollection
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }
