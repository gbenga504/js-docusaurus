import {
  Disposable,
  workspace,
  TextDocument,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  Diagnostic,
  Range,
} from 'vscode';
import { getCommentNameRegex, getFunctionNameRegex, CommentLineRegex } from './utils';

export default class LintService implements Disposable {
  private diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection(
    'javascript',
  );

  public registerDisposables(): Disposable[] {
    const fileSaveWatcher = workspace.onDidSaveTextDocument((document: TextDocument) => {
      if (document.languageId === 'typescript' || document.languageId === 'javascript') {
        this.checkFileDiagnotics(document);
      }
    });

    const fileOpenWatcher = workspace.onDidOpenTextDocument((document: TextDocument) => {
      if (document.languageId === 'typescript' || document.languageId === 'javascript') {
        this.checkFileDiagnotics(document);
      }
    });

    return [fileSaveWatcher, fileOpenWatcher, this.diagnosticCollection];
  }

  public checkFileDiagnotics(document: TextDocument) {
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

  private validateComment(
    document: TextDocument,
    match: RegExpExecArray,
    functionLineNumber: number,
  ): Diagnostic | null {
    let functionName = match[0];
    let commentNameRegex: RegExp = new RegExp(getCommentNameRegex(functionName));
    let isLineACommentRegex: RegExp = new RegExp(CommentLineRegex);
    let currentLine: number = functionLineNumber === 0 ? 0 : functionLineNumber - 1;
    let commentAtLine: string = document.lineAt(currentLine).text;

    if (isLineACommentRegex.test(commentAtLine) === false) {
      //return a diagostic saying that the function has to be a comment
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
      while (
        currentLine - 1 >= 0 &&
        isLineACommentRegex.test(document.lineAt(currentLine - 1).text) === true
      ) {
        currentLine -= 1;
        commentAtLine = document.lineAt(currentLine).text;
      }
      if (commentNameRegex.test(commentAtLine) === false) {
        //return a diagnotic requesting the user to work on the comment
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
