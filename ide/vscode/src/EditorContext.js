'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FileSync = require('./FileSync');

class EditorContext {
  static MAX_SELECTION_CHARS = 24000;
  static MAX_FILE_CHARS = 48000;
  static MAX_FILE_BYTES = 4 * 1024 * 1024;

  constructor(getRoot) {
    this.getRoot = getRoot;
  }

  relative(fsPath) {
    const root = this.getRoot();
    if (!root) return fsPath;
    const rel = path.relative(root, fsPath);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return fsPath;
    return rel.split(path.sep).join('/');
  }

  fromEditor(editor) {
    const doc = editor.document;
    if (doc.uri.scheme !== 'file') return null;
    const base = { id: crypto.randomUUID(), path: this.relative(doc.uri.fsPath), absPath: doc.uri.fsPath };
    const sel = editor.selection;
    if (sel.isEmpty) return { ...base, kind: 'file' };
    const endLine = sel.end.character === 0 && sel.end.line > sel.start.line ? sel.end.line : sel.end.line + 1;
    return { ...base, kind: 'selection', startLine: sel.start.line + 1, endLine, text: doc.getText(sel).slice(0, EditorContext.MAX_SELECTION_CHARS) };
  }

  fromUri(uri) {
    if (!uri || uri.scheme !== 'file') return null;
    return { id: crypto.randomUUID(), kind: 'file', path: this.relative(uri.fsPath), absPath: uri.fsPath };
  }

  readContextText(item) {
    if (item.text != null) return item.text;
    const open = vscode.workspace.textDocuments.find((d) => d.uri.scheme === 'file' && FileSync.key(d.uri.fsPath) === FileSync.key(item.absPath));
    if (open) return open.getText().slice(0, EditorContext.MAX_FILE_CHARS);
    try {
      const st = fs.statSync(item.absPath);
      if (!st.isFile() || st.size > EditorContext.MAX_FILE_BYTES) return null;
      return fs.readFileSync(item.absPath, 'utf8').slice(0, EditorContext.MAX_FILE_CHARS);
    } catch (_) { return null; }
  }
}

module.exports = EditorContext;
