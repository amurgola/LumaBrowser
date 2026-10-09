'use strict';

const vscode = require('vscode');
const GitChangeSet = require('./GitChangeSet');

class CommitMessageCommand {
  static async run(session, arg) {
    const api = await CommitMessageCommand._gitApi();
    if (!api) { vscode.window.showWarningMessage('Luma: the built-in Git extension is not available.'); return; }
    const repo = GitChangeSet.pickRepository(api, arg, session.root);
    if (!repo) { vscode.window.showWarningMessage('Luma: no Git repository is open.'); return; }
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.SourceControl, title: 'Luma is drafting a commit message…' },
      () => CommitMessageCommand._draft(session, repo),
    );
  }

  static async _draft(session, repo) {
    try {
      const { diff, files, scope } = await GitChangeSet.collect(repo);
      if (!diff || !diff.trim()) { vscode.window.showInformationMessage('Luma: there are no changes to describe.'); return; }
      if (!(await session.awaitReady())) {
        vscode.window.showWarningMessage(`Luma: ${session.statusMessage || 'LumaBrowser is not connected.'}`);
        return;
      }
      repo.inputBox.value = await session.generateCommitMessage(diff.slice(0, GitChangeSet.MAX_TOTAL_CHARS), files, repo.inputBox.value);
      if (scope === 'working tree') vscode.window.setStatusBarMessage('Luma: nothing was staged, so the draft covers the working tree.', 6000);
    } catch (e) {
      vscode.window.showWarningMessage(`Luma: ${(e && e.message) || 'could not draft a commit message.'}`);
    }
  }

  static async _gitApi() {
    const ext = vscode.extensions.getExtension('vscode.git');
    if (!ext) return null;
    try {
      if (!ext.isActive) await ext.activate();
      return ext.exports.getAPI(1);
    } catch (_) { return null; }
  }
}

module.exports = CommitMessageCommand;
