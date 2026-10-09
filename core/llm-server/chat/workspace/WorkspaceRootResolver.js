const fs = require('fs');
const path = require('path');
const ChatModeRegistry = require('../ChatModeRegistry');

class WorkspaceRootResolver {
  constructor({ chatRouter, modeRegistry = ChatModeRegistry.shared } = {}) {
    this._chatRouter = chatRouter;
    this._modeRegistry = modeRegistry;
  }

  resolve(conversationId) {
    if (!conversationId) return null;
    const meta = this._readMeta(conversationId);
    if (meta === undefined) return null;
    const modeId = (meta && meta.mode) || null;
    const declared = this._fromModeHook(modeId, conversationId, meta) || WorkspaceRootResolver._fromProjectPath(meta);
    if (!declared) return null;
    return WorkspaceRootResolver._existingDirectory(declared, modeId);
  }

  _readMeta(conversationId) {
    try {
      return this._chatRouter.chatStore.getMeta(conversationId);
    } catch (_) {
      return undefined;
    }
  }

  _fromModeHook(modeId, conversationId, meta) {
    const descriptor = modeId ? this._modeRegistry.get(modeId) : null;
    if (!descriptor || typeof descriptor.workspaceRoot !== 'function') return null;
    try {
      const answer = descriptor.workspaceRoot({ conversationId, meta });
      if (typeof answer === 'string' && answer) return { root: answer, label: null };
      if (answer && answer.root) return { root: String(answer.root), label: answer.label ? String(answer.label) : null };
    } catch (_) {}
    return null;
  }

  static _fromProjectPath(meta) {
    const projectPath = meta && meta.data && meta.data.projectPath;
    return projectPath ? { root: String(projectPath), label: null } : null;
  }

  static _existingDirectory({ root, label }, modeId) {
    const abs = path.resolve(root);
    try {
      if (!fs.statSync(abs).isDirectory()) return null;
    } catch (_) {
      return null;
    }
    return { root: abs, label: label || path.basename(abs) || abs, mode: modeId };
  }
}

module.exports = WorkspaceRootResolver;
