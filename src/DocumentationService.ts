import {
    Disposable,
    workspace,
    TextDocument,
    DiagnosticCollection,
    DiagnosticSeverity,
    languages,
    Diagnostic,
    Range
} from "vscode";
import { getCommentNameRegex, getFunctionNameRegex, CommentLineRegex } from './utils';

export default class DocumentationService extends Disposable {
    private diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection("javascript")

    constructor(callOnDispose: Function) {
        super(callOnDispose)
        this.diagnosticCollection.clear()
    }

    public registerDisposables(): Disposable[] {
        const fileSaveWatcher = workspace.onDidSaveTextDocument((document: TextDocument) => {
            if (document.languageId === "typescript" || document.languageId === "javascript") {
                this.checkFileDiagnotics(document)
            }
        })

        const fileOpenWatcher = workspace.onDidOpenTextDocument((document: TextDocument) => {
            if (document.languageId === "typescript" || document.languageId === "javascript") {
                this.checkFileDiagnotics(document)
            }
        })

        return [
            fileSaveWatcher,
            fileOpenWatcher,
            this.diagnosticCollection
        ]
    }

    private checkFileDiagnotics(document: TextDocument) {
        let diagnotics: Diagnostic[] = []
        Array.apply(null, Array(document.lineCount)).forEach((value: any, index: number) => {
            let text: string = document.lineAt(index).text;
            let regex: RegExp = new RegExp(getFunctionNameRegex);
            let match: RegExpExecArray | null = regex.exec(text);
            if (match !== null) {
                let commentDiagnostics: Diagnostic | null = this.validateComment(document, match, index);
                if (commentDiagnostics) {
                    diagnotics.push(commentDiagnostics)
                }
            }
        })
        this.diagnosticCollection.set(document.uri, diagnotics);
    }

    private validateComment(document: TextDocument, match: RegExpExecArray, functionLineNumber: number): Diagnostic | null {
        let functionName = match[0];
        let commentNameRegex: RegExp = new RegExp(getCommentNameRegex(functionName));
        let isLineACommentRegex: RegExp = new RegExp(CommentLineRegex);
        let currentLine: number = functionLineNumber - 1;

        if (isLineACommentRegex.test(document.lineAt(currentLine).text) === false) {
            //return a diagostic saying that the function has to be a comment
            return new Diagnostic(
                new Range(functionLineNumber, match.index, functionLineNumber, (match.index + match[0].length) - 1),
                `exported function ${functionName} should have comment or be unexported`,
                DiagnosticSeverity.Warning
            )
        }
        else {
            let commentAtLine: string = document.lineAt(currentLine).text;
            while (isLineACommentRegex.test(document.lineAt(currentLine - 1).text) === true) {
                currentLine -= 1;
                commentAtLine = document.lineAt(currentLine).text;
            }
            if (commentNameRegex.test(commentAtLine) === false) {
                return new Diagnostic(
                    new Range(functionLineNumber, match.index, functionLineNumber, (match.index + match[0].length) - 1),
                    `${functionName} should have comment`,
                    DiagnosticSeverity.Warning
                )
            }
        }
        return null
    }
}