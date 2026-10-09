const fs = require('fs');
const path = require('path');

class ModelDirWalker {
  static MAX_DEPTH = 5;

  static MAX_ENTRIES = 4000;

  static GGUF_EXT = '.gguf';

  static ADDON_EXTS = Object.freeze({ '.ninfer': 'ninfer' });

  async walk(rootDir) {
    this._reset();
    const queue = [{ dir: rootDir, depth: 0 }];
    const visitedDirs = new Set();
    while (queue.length > 0 && this._visited < ModelDirWalker.MAX_ENTRIES) {
      const { dir, depth } = queue.shift();
      if (visitedDirs.has(dir)) continue;
      visitedDirs.add(dir);
      await this._readDir(dir, depth, queue);
    }
    return { ggufs: this._ggufs, addonFiles: this._addonFiles, mlxDirs: this._mlxDirs, visited: this._visited };
  }

  _reset() {
    this._ggufs = [];
    this._addonFiles = [];
    this._mlxDirs = new Map();
    this._visited = 0;
  }

  async _readDir(dir, depth, queue) {
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      this._visited++;
      if (this._visited > ModelDirWalker.MAX_ENTRIES) break;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth + 1 <= ModelDirWalker.MAX_DEPTH) queue.push({ dir: abs, depth: depth + 1 });
      } else if (entry.isFile()) {
        await this._collectFile(dir, abs, entry.name);
      }
    }
  }

  async _collectFile(dir, abs, name) {
    const ext = path.extname(name).toLowerCase();
    if (ext === ModelDirWalker.GGUF_EXT) return this._collectGguf(dir, abs, name);
    if (Object.prototype.hasOwnProperty.call(ModelDirWalker.ADDON_EXTS, ext)) return this._collectAddon(dir, abs, name, ext);
    if (ext === '.safetensors' || name.toLowerCase() === 'config.json') return this._collectMlxPart(dir, abs, name);
    return undefined;
  }

  async _collectGguf(dir, abs, name) {
    const stat = await ModelDirWalker._stat(abs);
    if (!stat) return;
    this._ggufs.push({
      path: abs,
      name,
      directory: dir,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime ? stat.mtime.toISOString() : null,
    });
  }

  async _collectAddon(dir, abs, name, ext) {
    const stat = await ModelDirWalker._stat(abs);
    if (!stat) return;
    this._addonFiles.push({ path: abs, name, directory: dir, sizeBytes: stat.size, defaultKind: ModelDirWalker.ADDON_EXTS[ext] });
  }

  async _collectMlxPart(dir, abs, name) {
    let mlxDir = this._mlxDirs.get(dir);
    if (!mlxDir) {
      mlxDir = { safetensors: [], hasConfig: false, configPath: null };
      this._mlxDirs.set(dir, mlxDir);
    }
    if (name.toLowerCase() === 'config.json') {
      mlxDir.hasConfig = true;
      mlxDir.configPath = abs;
      return;
    }
    const stat = await ModelDirWalker._stat(abs);
    if (stat) mlxDir.safetensors.push({ path: abs, name, sizeBytes: stat.size });
  }

  static async _stat(abs) {
    try {
      return await fs.promises.stat(abs);
    } catch (_) {
      return null;
    }
  }
}

module.exports = ModelDirWalker;
