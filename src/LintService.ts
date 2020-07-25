import {
    Disposable,
    workspace,
    TextDocument,
    DiagnosticCollection,
    DiagnosticSeverity,
    languages,
    Diagnostic,
    Range,
    window,
    TextEditor
} from 'vscode';
import { getCommentNameRegex, getFunctionNameRegex, CommentLineRegex } from './utils';

export default class LintService implements Disposable {
    private diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection(
        'javascript',
    );

    public registerDisposables(): Disposable[] {
        const fileSaveWatcher = workspace.onDidSaveTextDocument((document: TextDocument) => {
            if (document.languageId === 'typescript' || document.languageId === 'javascript') {
                this.checkFileDiagnostics(document);
            }
        });

        const fileOpenWatcher = window.onDidChangeActiveTextEditor((textEditor: TextEditor | undefined) => {
            if (textEditor) {
                let document: TextDocument = textEditor.document;
                if (document.languageId === 'typescript' || document.languageId === 'javascript') {
                    this.checkFileDiagnostics(document);
                }
            }
        });

        return [fileSaveWatcher, fileOpenWatcher, this.diagnosticCollection];
    }

    // checkFileDiagnostics sets the diagnostics for a document
    // It runs through each line then tries to match for a function declaration;
    // it then calls the validateComment function to validate if the function is properly linted based on some predefined rules
    public checkFileDiagnostics(document: TextDocument) {
        let diagnotics: Diagnostic[] = [];
        Array.apply(null, Array(document.lineCount)).forEach((value: any, index: number) => {
            let text: string = document.lineAt(index).text;
            let regex: RegExp = new RegExp(getFunctionNameRegex);
            let match: RegExpExecArray | null = regex.exec(text);
            if (match !== null) {
                let commentDiagnostics: Diagnostic | null = this.validateComment(document, match, index);
                if (commentDiagnostics) {
                    diagnotics.push(commentDiagnostics);
                }
            }
        });
        this.diagnosticCollection.set(document.uri, diagnotics);
    }

    // validateComment validates a function declaration against the linter's comment rules
    private validateComment(
        document: TextDocument,
        match: RegExpExecArray,
        functionLineNumber: number,
    ): Diagnostic | null {
        let functionName = match[0];
        let commentNameRegex: RegExp = new RegExp(getCommentNameRegex(functionName));
        let isLineACommentRegex: RegExp = new RegExp(CommentLineRegex);
        // change the current line to the line directly above the function declaration or 0 if the function declaration line = 0
        let currentLine: number = functionLineNumber === 0 ? 0 : functionLineNumber - 1;
        let commentAtLine: string = document.lineAt(currentLine).text;

        if (isLineACommentRegex.test(commentAtLine) === false) {
            //return a diagostic saying that the function has to be commented and set current line to function declaration
            currentLine = currentLine === 0 ? 0 : currentLine + 1;
            return new Diagnostic(
                new Range(
                    functionLineNumber,
                    0,
                    functionLineNumber,
                    document.lineAt(currentLine).text.length,
                ),
                `exported function ${functionName} should have comment or be unexported`,
                DiagnosticSeverity.Warning,
            );
        } else {
            //Find the first comment line and grab the comment name
            //return a diagnotic requesting the user to work on the comment if comment name is not equal to function name
            while (
                currentLine - 1 >= 0 &&
                isLineACommentRegex.test(document.lineAt(currentLine - 1).text) === true
            ) {
                currentLine -= 1;
                commentAtLine = document.lineAt(currentLine).text;
            }
            if (commentNameRegex.test(commentAtLine) === false) {

                return new Diagnostic(
                    new Range(
                        currentLine,
                        0,
                        functionLineNumber - 1,
                        document.lineAt(functionLineNumber - 1).text.length,
                    ),
                    `comment on exported function ${functionName} should be of the form "${functionName} ..."`,
                    DiagnosticSeverity.Warning,
                );
            }
        }
        return null;
    }

    public get diagoniticsCollection(): DiagnosticCollection {
        return this.diagnosticCollection;
    }

    public dispose = () => {
        this.diagnosticCollection.clear();
    };
}
