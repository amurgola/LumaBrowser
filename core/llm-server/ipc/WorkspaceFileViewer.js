const fs = require('fs');
const path = require('path');

class WorkspaceFileViewer {
  static MAX_VIEW_BYTES = 512 * 1024;
  static ARGS_REQUIRED = 'conversationId and path are required';
  static NO_FOLDER = 'This conversation has no project folder.';
  static ESCAPES = 'Path escapes the project folder.';
  static NOT_A_FILE = 'Not a file.';

  constructor(workspaceFiles) {
    this._workspace = workspaceFiles;
  }

  read(args) {
    const conversationId = args && args.conversationId ? String(args.conversationId) : '';
    const relPath = args && args.path ? String(args.path) : '';
    if (!conversationId || !relPath) throw new Error(WorkspaceFileViewer.ARGS_REQUIRED);
    const abs = this._containedPath(conversationId, relPath);
    if (!fs.statSync(abs).isFile()) throw new Error(WorkspaceFileViewer.NOT_A_FILE);
    return { path: relPath, ...WorkspaceFileViewer._readCapped(abs) };
  }

  _containedPath(conversationId, relPath) {
    const info = this._workspace.resolveRoot(conversationId);
    if (!info) throw new Error(WorkspaceFileViewer.NO_FOLDER);
    const root = info.root;
    const abs = path.resolve(root, relPath);
    if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error(WorkspaceFileViewer.ESCAPES);
    return abs;
  }

  static _readCapped(abs) {
    const content = fs.readFileSync(abs, 'utf8');
    if (content.length <= WorkspaceFileViewer.MAX_VIEW_BYTES) return { content, truncated: false };
    return { content: content.slice(0, WorkspaceFileViewer.MAX_VIEW_BYTES), truncated: true };
  }
}

module.exports = WorkspaceFileViewer;
