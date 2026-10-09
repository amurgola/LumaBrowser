'use strict';

const vscode = require('vscode');
const SessionStatus = require('./SessionStatus');
const LumaSettings = require('./LumaSettings');
const CommitMessageCommand = require('./CommitMessageCommand');

class LumaCommands {
  static MAX_ATTACHED_FILES = 12;
  static EXTENSION_ID = 'lumabyte.luma-vscode';

  constructor({ session, view, editorContext }) {
    this._session = session;
    this._view = view;
    this._editorContext = editorContext;
  }

  handlers() {
    const s = this._session;
    return {
      'luma.ask': () => this._ask(),
      'luma.addSelection': () => this._addSelection(),
      'luma.addFile': (uri, uris) => this._addFiles(uri, uris),
      'luma.newSession': async () => { s.newSession(); await this._view.reveal(true); },
      'luma.stop': () => s.abort(),
      'luma.openInApp': () => s.openInApp(),
      'luma.reconnect': () => s.connect({ startIfNeeded: true }),
      'luma.openSettings': () => vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${LumaCommands.EXTENSION_ID}`),
      'luma.toggleApprovals': () => this._toggleApprovals(),
      'luma.toggleReasoning': () => LumaSettings.update('showReasoning', !LumaSettings.read().showReasoning),
      'luma.chooseAgent': () => this._chooseAgent(),
      'luma.generateCommitMessage': (arg) => CommitMessageCommand.run(s, arg),
    };
  }

  register(context) {
    for (const [id, fn] of Object.entries(this.handlers())) context.subscriptions.push(vscode.commands.registerCommand(id, fn));
  }

  async _ask() {
    const ed = vscode.window.activeTextEditor;
    const item = ed ? this._editorContext.fromEditor(ed) : null;
    if (item) this._session.addContext(item);
    await this._view.reveal(true);
  }

  async _addSelection() {
    const ed = vscode.window.activeTextEditor;
    const item = ed && !ed.selection.isEmpty ? this._editorContext.fromEditor(ed) : null;
    if (!item) return;
    this._session.addContext(item);
    await this._view.reveal(false);
  }

  async _addFiles(uri, uris) {
    let added = 0;
    for (const u of LumaCommands._pickedUris(uri, uris)) {
      const item = this._editorContext.fromUri(u);
      if (!item || !(await LumaCommands._isFile(u))) continue;
      this._session.addContext(item);
      added++;
    }
    if (added > LumaCommands.MAX_ATTACHED_FILES) vscode.window.showWarningMessage('Luma: only the first 12 attached files reach the model per prompt.');
    if (added) await this._view.reveal(false);
  }

  static _pickedUris(uri, uris) {
    const picked = Array.isArray(uris) && uris.length ? uris : (uri ? [uri] : []);
    if (picked.length) return picked;
    return vscode.window.activeTextEditor ? [vscode.window.activeTextEditor.document.uri] : [];
  }

  static async _isFile(uri) {
    try { return !((await vscode.workspace.fs.stat(uri)).type & vscode.FileType.Directory); } catch (_) { return false; }
  }

  _toggleApprovals() {
    const next = this._session.approval === 'never' ? 'ask' : 'never';
    this._session.setApproval(next);
    vscode.window.setStatusBarMessage(next === 'ask' ? 'Luma: asking before edits and commands.' : 'Luma: approvals are off for this session.', 4000);
  }

  async _chooseAgent() {
    const s = this._session;
    if (s.status !== SessionStatus.READY) { vscode.window.showInformationMessage('Luma: connect to LumaBrowser first.'); return; }
    s.requestAgents();
    const rows = [{ label: 'Code (no agent)', agentName: null }]
      .concat(s.agents.map((a) => ({ label: a.name, description: a.model || '', detail: a.description || undefined, agentName: a.name })));
    const pick = await vscode.window.showQuickPick(rows, { title: 'Answer As', placeHolder: s.agent ? `Now: ${s.agent.name}` : 'Now: Code' });
    if (pick) s.switchAgent(pick.agentName);
  }
}

module.exports = LumaCommands;
