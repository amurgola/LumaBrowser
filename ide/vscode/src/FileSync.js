'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class FileSync {
  static BEFORE_SCHEME = 'luma-before';
  static MAX_SNAPSHOTS = 40;

  constructor(getRoot) {
    this.getRoot = getRoot;
    this._snapshots = new Map();
    this._changed = new vscode.EventEmitter();
    this.beforeProvider = {
      onDidChange: this._changed.event,
      provideTextDocumentContent: (uri) => this._snapshots.get(FileSync.key(uri.fsPath)) || '',
    };
  }

  static key(abs) {
    return process.platform === 'win32' ? abs.toLowerCase() : abs;
  }

  resolve(root, p) {
    if (path.isAbsolute(p)) return path.normalize(p);
    return path.normalize(path.join(root || this.getRoot() || process.cwd(), p));
  }

  snapshot(root, p) {
    const abs = this.resolve(root, p);
    const k = FileSync.key(abs);
    this._snapshots.delete(k);
    this._snapshots.set(k, FileSync._currentText(abs));
    while (this._snapshots.size > FileSync.MAX_SNAPSHOTS) this._snapshots.delete(this._snapshots.keys().next().value);
    this._changed.fire(vscode.Uri.file(abs).with({ scheme: FileSync.BEFORE_SCHEME }));
  }

  async afterWrite(root, p, open) {
    if (!open) return;
    const abs = this.resolve(root, p);
    try {
      if (!fs.statSync(abs).isFile()) return;
      await vscode.window.showTextDocument(vscode.Uri.file(abs), { preview: true, preserveFocus: true });
    } catch (_) {}
  }

  async showDiff(root, p) {
    const abs = this.resolve(root, p);
    const right = vscode.Uri.file(abs);
    const left = right.with({ scheme: FileSync.BEFORE_SCHEME });
    try {
      await vscode.commands.executeCommand('vscode.diff', left, right, `Luma: ${path.basename(abs)} (before ↔ current)`, { preview: true });
    } catch (e) {
      vscode.window.showWarningMessage(`Luma: could not open the diff for ${path.basename(abs)}: ${e && e.message}`);
    }
  }

  async openFile(root, p, line) {
    const abs = this.resolve(root, p);
    try {
      if (!fs.statSync(abs).isFile()) return;
      const opts = {};
      if (Number.isInteger(line) && line > 0) { const pos = new vscode.Position(line - 1, 0); opts.selection = new vscode.Range(pos, pos); }
      await vscode.window.showTextDocument(vscode.Uri.file(abs), opts);
    } catch (_) {}
  }

  async insertAtCaret(text) {
    const ed = vscode.window.activeTextEditor || vscode.window.visibleTextEditors[0];
    if (!ed) { vscode.window.showInformationMessage('Luma: open a file to insert into.'); return; }
    await ed.edit((b) => { if (ed.selection.isEmpty) b.insert(ed.selection.active, text); else b.replace(ed.selection, text); });
  }

  static _currentText(abs) {
    const open = vscode.workspace.textDocuments.find((d) => d.uri.scheme === 'file' && FileSync.key(d.uri.fsPath) === FileSync.key(abs));
    if (open) return open.getText();
    try { return fs.statSync(abs).isFile() ? fs.readFileSync(abs, 'utf8') : ''; } catch (_) { return ''; }
  }
}

module.exports = FileSync;
