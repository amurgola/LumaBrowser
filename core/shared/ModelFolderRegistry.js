const path = require('path');

class ModelFolderRegistry {
  static _providers = new Map();

  static register(kind, provider) {
    if (!kind || typeof provider !== 'function') return;
    ModelFolderRegistry._providers.set(kind, provider);
  }

  static unregister(kind) {
    ModelFolderRegistry._providers.delete(kind);
  }

  static folderOf(kind) {
    const provider = ModelFolderRegistry._providers.get(kind);
    if (!provider) return null;
    try {
      return ModelFolderRegistry.normalize(provider());
    } catch (_) {
      return null;
    }
  }

  static foldersExcept(kind) {
    const out = [];
    for (const other of ModelFolderRegistry._providers.keys()) {
      if (other === kind) continue;
      const dir = ModelFolderRegistry.folderOf(other);
      if (dir) out.push(dir);
    }
    return out;
  }

  static isOneOf(dir, folders) {
    const target = ModelFolderRegistry.normalize(dir);
    return !!target && (folders || []).some((folder) => ModelFolderRegistry.normalize(folder) === target);
  }

  static normalize(dir) {
    if (typeof dir !== 'string' || !dir.trim()) return null;
    let out = path.resolve(dir.trim());
    if (out.length > 1 && (out.endsWith(path.sep) || out.endsWith('/'))) out = out.slice(0, -1);
    return process.platform === 'win32' ? out.toLowerCase() : out;
  }

  static _reset() {
    ModelFolderRegistry._providers.clear();
  }
}

module.exports = ModelFolderRegistry;
