const fs = require('fs');
const path = require('path');

class SharedLibLinker {
  static MAX_DEPTH = 5;

  static async consolidate(rootDir, binDir) {
    const queue = [{ dir: rootDir, depth: 0 }];
    while (queue.length > 0) {
      const { dir, depth } = queue.shift();
      if (path.resolve(dir) === path.resolve(binDir)) continue;
      for (const child of await SharedLibLinker._children(dir)) {
        const full = path.join(dir, child.name);
        if (child.isDirectory()) {
          if (depth < SharedLibLinker.MAX_DEPTH) queue.push({ dir: full, depth: depth + 1 });
        } else if (SharedLibLinker._isLibEntry(child)) {
          await SharedLibLinker._link(full, binDir, child.name);
        }
      }
    }
  }

  static isSharedLib(name) {
    return /\.so(\.\d+)*$/.test(name);
  }

  static _isLibEntry(child) {
    return (child.isFile() || child.isSymbolicLink()) && SharedLibLinker.isSharedLib(child.name);
  }

  static async _children(dir) {
    try {
      return await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return [];
    }
  }

  static async _link(target, binDir, name) {
    try {
      await fs.promises.symlink(path.relative(binDir, target), path.join(binDir, name));
    } catch (_) {}
  }
}

module.exports = SharedLibLinker;
