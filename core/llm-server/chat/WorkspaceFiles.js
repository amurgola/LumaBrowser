const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');
const ChatModeRegistry = require('./ChatModeRegistry');
const WorkspaceRootResolver = require('./workspace/WorkspaceRootResolver');
const DirectoryListing = require('./workspace/DirectoryListing');
const EditorFileReader = require('./workspace/EditorFileReader');

class WorkspaceFiles {
  static MAX_WRITE_BYTES = 8 * 1024 * 1024;
  static NO_FOLDER = 'This conversation has no code folder.';
  static TAKEN = 'That name is already taken.';

  constructor({ chatRouter, modeRegistry = ChatModeRegistry.shared } = {}) {
    this._roots = new WorkspaceRootResolver({ chatRouter, modeRegistry });
  }

  resolveRoot(conversationId) {
    return this._roots.resolve(conversationId);
  }

  info(conversationId) {
    const info = this.resolveRoot(conversationId);
    if (!info) return { success: false, error: WorkspaceFiles.NO_FOLDER };
    return { success: true, root: info.root, label: info.label, mode: info.mode };
  }

  listDir(conversationId, relDir) {
    const { info, abs, rel } = this._resolveTarget(conversationId, relDir, { allowRoot: true });
    const listing = DirectoryListing.list(abs, rel);
    if (!listing.success) return listing;
    return { success: true, root: info.root, label: info.label, ...WorkspaceFiles._withoutSuccess(listing) };
  }

  readFile(conversationId, relPath) {
    const { abs, rel } = this._resolveTarget(conversationId, relPath);
    return EditorFileReader.read(abs, rel);
  }

  writeFile(conversationId, relPath, content) {
    const { abs, rel } = this._resolveTarget(conversationId, relPath);
    const text = String(content == null ? '' : content);
    const size = Buffer.byteLength(text, 'utf8');
    if (size > WorkspaceFiles.MAX_WRITE_BYTES) return { success: false, error: 'File is too large to save.' };
    if (WorkspaceFiles._isNonFile(abs)) return { success: false, error: 'Not a file.' };
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text, 'utf8');
    return { success: true, path: rel, size };
  }

  createEntry(conversationId, relPath, kind) {
    const { abs, rel } = this._resolveTarget(conversationId, relPath);
    if (fs.existsSync(abs)) return { success: false, error: WorkspaceFiles.TAKEN };
    const isDir = kind === 'dir';
    fs.mkdirSync(isDir ? abs : path.dirname(abs), { recursive: true });
    if (!isDir) fs.writeFileSync(abs, '', 'utf8');
    return { success: true, path: rel, type: isDir ? 'dir' : 'file' };
  }

  renameEntry(conversationId, relPath, toRelPath) {
    const from = this._resolveTarget(conversationId, relPath);
    const to = this._resolveTarget(conversationId, toRelPath);
    if (!fs.existsSync(from.abs)) return { success: false, error: 'That file no longer exists.' };
    if (fs.existsSync(to.abs)) return { success: false, error: WorkspaceFiles.TAKEN };
    fs.mkdirSync(path.dirname(to.abs), { recursive: true });
    fs.renameSync(from.abs, to.abs);
    return { success: true, path: to.rel };
  }

  removeEntry(conversationId, relPath) {
    const { abs, rel } = this._resolveTarget(conversationId, relPath);
    if (fs.existsSync(abs)) fs.rmSync(abs, { recursive: true, force: true });
    return { success: true, path: rel };
  }

  _resolveTarget(conversationId, relPath, { allowRoot = false } = {}) {
    const info = this.resolveRoot(conversationId);
    if (!info) throw new Error(WorkspaceFiles.NO_FOLDER);
    const rel = WorkspaceFiles._normalizeRelative(relPath);
    if (!rel) {
      if (allowRoot) return { info, abs: info.root, rel: '' };
      throw new Error('A file path is required');
    }
    return { info, abs: ContainedPath.resolveWithin(info.root, rel, { label: 'code folder' }), rel };
  }

  static _normalizeRelative(relPath) {
    const rel = String(relPath == null ? '' : relPath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (rel.includes('\0')) throw new Error('Invalid path.');
    return rel;
  }

  static _isNonFile(abs) {
    try {
      return fs.existsSync(abs) && !fs.statSync(abs).isFile();
    } catch (_) {
      return false;
    }
  }

  static _withoutSuccess(result) {
    const { success: _success, ...rest } = result;
    return rest;
  }
}

module.exports = WorkspaceFiles;
