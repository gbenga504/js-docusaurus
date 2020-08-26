import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { getFunctionNameRegex, CommentLineRegex, getCommentNameRegex } from '../../utils';
import LintService from '../../LintService';

/**
 * gets the workspace folder by name
 * @param name Workspace folder name
 */
export const getWorkspaceFolderUri = (workspaceFolderName: string) => {
  const workspaceFolder = vscode.workspace.workspaceFolders!.find((folder) => {
    return folder.name === workspaceFolderName;
  });
  if (!workspaceFolder) {
    throw new Error(
      'Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?',
    );
  }
  return workspaceFolder!.uri;
};

export async function lintDocument(workspaceFolderName: string, testFile: string) {
  const lintService = new LintService();
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const absPath = path.join(base.fsPath, testFile);
  const document = await vscode.workspace.openTextDocument(absPath);
  await vscode.window.showTextDocument(document);

  console.time(testFile);
  lintService.checkFileDiagnostics(document);
  console.timeEnd(testFile);

  return lintService.diagoniticsCollection.get(document.uri) || [];
}

suite('Test Linter', function () {
  let diagnostics: any;

  this.beforeAll(async () => {
    diagnostics = await lintDocument('src', 'index.js');
  });

  suite('function name', () => {
    test('is fn1', () => {
      let functionName = new RegExp(getFunctionNameRegex).exec(`export function fn1(){}`);
      assert.equal(functionName && functionName[0], 'fn1');
    });

    test('is fn2', () => {
      let functionName = new RegExp(getFunctionNameRegex).exec(`export default function fn2(){}`);
      assert.equal(functionName && functionName[0], 'fn2');
    });

    test('is fn3', () => {
      let functionName = new RegExp(getFunctionNameRegex).exec(`export const fn3 = () => {}`);
      assert.equal(functionName && functionName[0], 'fn3');
    });

    test('is fn4', () => {
      let functionName = new RegExp(getFunctionNameRegex).exec(`export default fn4 = () => {}`);
      assert.equal(functionName && functionName[0], 'fn4');
    });
  });

  suite('line text', () => {
    test('is a comment', () => {
      let lineText = '// This is a comment line';
      assert.equal(new RegExp(CommentLineRegex).test(lineText), true);
    });

    test('has comment name getQueryParameters', () => {
      let lineText = '//getQueryParameters is a comment line';
      assert.equal(new RegExp(getCommentNameRegex('getQueryParameters')).test(lineText), true);
    });

    test('has no comment name', () => {
      let lineText = '// ';
      assert.equal(new RegExp(getCommentNameRegex('getQueryParameters')).test(lineText), false);
    });
  });

  suite('lint document', function () {
    test('it produces 5 diagnostics', async () => {
      assert.equal(diagnostics.length, 5);
    });

    test(`it produces "exported function fn3 should have comment or be unexported" as message for second diagnotics`, async () => {
      assert.equal(
        diagnostics[1].message,
        `exported function fn3 should have comment or be unexported`,
      );
    });

    test(`it produces "comment on exported function fn4 should be of the form "fn4 ..."" as message for third diagnotics`, async () => {
      assert.equal(
        diagnostics[2].message,
        `comment on exported function fn4 should be of the form "fn4 ..."`,
      );
    });

    test('it produces correct first diagnostic range', async () => {
      let actual = {
        startLine: diagnostics[0].range.start.line,
        startCharacter: diagnostics[0].range.start.character,
        endLine: diagnostics[0].range.end.line,
        endCharacter: diagnostics[0].range.end.character,
      };
      let expected = {
        startLine: 5,
        startCharacter: 0,
        endLine: 5,
        endCharacter: 31,
      };
      assert.deepEqual(actual, expected);
    });

    test('it produces correct third diagnostic range', async () => {
      let actual = {
        startLine: diagnostics[2].range.start.line,
        startCharacter: diagnostics[2].range.start.character,
        endLine: diagnostics[2].range.end.line,
        endCharacter: diagnostics[2].range.end.character,
      };
      let expected = {
        startLine: 13,
        startCharacter: 0,
        endLine: 14,
        endCharacter: 30,
      };
      assert.deepEqual(actual, expected);
    });

    test('exported const Status must have a comment', async () => {
      let actual = {
        startLine: diagnostics[3]?.range?.start?.line,
        startCharacter: diagnostics[3]?.range?.start?.character,
        endLine: diagnostics[3]?.range?.end?.line,
        endCharacter: diagnostics[3]?.range?.end?.character,
      };
      let expected = {
        startLine: 23,
        startCharacter: 0,
        endLine: 23,
        endCharacter: 23,
      };
      assert.deepEqual(actual, expected);
    })
  });
});
