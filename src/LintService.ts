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
  TextEditor,
} from 'vscode';
import { getCommentNameRegex, getIdentifierNameRegex, CommentLineRegex } from './utils';

type ErrorType = 'NOT_DOCUMENTED' | 'IMPROPER_COMMENT';

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

    const fileOpenWatcher = window.onDidChangeActiveTextEditor(
      (textEditor: TextEditor | undefined) => {
        if (textEditor) {
          let document: TextDocument = textEditor.document;
          if (document.languageId === 'typescript' || document.languageId === 'javascript') {
            this.checkFileDiagnostics(document);
          }
        }
      },
    );

    return [fileSaveWatcher, fileOpenWatcher, this.diagnosticCollection];
  }

  // checkFileDiagnostics sets the diagnostics for a document
  // It runs through each line then tries to match for an identifier declaration;
  // it then calls the validateComment method to validate if the identifier is properly linted based on some predefined rules
  public checkFileDiagnostics(document: TextDocument) {
    let diagnotics: Diagnostic[] = [];
    Array.apply(null, Array(document.lineCount)).forEach((value: any, index: number) => {
      let text: string = document.lineAt(index).text;
      let regex: RegExp = new RegExp(getIdentifierNameRegex);
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

  // validateComment validates an identifier declaration against the linter's comment rules
  private validateComment(
    document: TextDocument,
    match: RegExpExecArray,
    identifierLineNumber: number,
  ): Diagnostic | null {
    let identifierName = match[0];
    let commentNameRegex: RegExp = new RegExp(getCommentNameRegex(identifierName));
    let isLineACommentRegex: RegExp = new RegExp(CommentLineRegex);
    // change the current line to the line directly above the identifier declaration or 0 if the identifier declaration line = 0
    let currentLine: number = identifierLineNumber === 0 ? 0 : identifierLineNumber - 1;
    let commentAtLine: string = document.lineAt(currentLine).text;

    if (isLineACommentRegex.test(commentAtLine) === false) {
      //return a diagostic saying that the identifier has to be commented
      currentLine = currentLine === 0 ? 0 : currentLine + 1;
      return this.getDiagnostic(
        new Range(
          identifierLineNumber,
          0,
          identifierLineNumber,
          document.lineAt(currentLine).text.length,
        ),
        identifierName,
        'NOT_DOCUMENTED',
      );
    } else {
      //Find the first comment line and grab the comment name
      //return a diagnotic requesting the user to work on the comment if comment name is not equal to identifier name
      while (
        currentLine - 1 >= 0 &&
        isLineACommentRegex.test(document.lineAt(currentLine - 1).text) === true
      ) {
        currentLine -= 1;
        commentAtLine = document.lineAt(currentLine).text;
      }
      if (commentNameRegex.test(commentAtLine) === false) {
        return this.getDiagnostic(
          new Range(
            currentLine,
            0,
            identifierLineNumber - 1,
            document.lineAt(identifierLineNumber - 1).text.length,
          ),
          identifierName,
          'IMPROPER_COMMENT',
        );
      }
    }
    return null;
  }

  // getDiagnostic returns the diagnostics
  private getDiagnostic(range: Range, identifierName: string, type: ErrorType): Diagnostic {
    let message: string =
      type === 'NOT_DOCUMENTED'
        ? `exported identifier ${identifierName} should have comment or be unexported`
        : `comment on exported identifier ${identifierName} should be of the form "${identifierName} ..."`;
    return new Diagnostic(range, message, DiagnosticSeverity.Warning);
  }

  public get diagoniticsCollection(): DiagnosticCollection {
    return this.diagnosticCollection;
  }

  public dispose = () => {
    this.diagnosticCollection.clear();
  };
}
