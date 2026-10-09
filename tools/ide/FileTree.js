const fs = require('fs');
const path = require('path');

class FileTree {
  static newestMtime(dir, skip = []) {
    let newest = 0;
    for (const file of FileTree._walk(dir, new Set(skip))) newest = Math.max(newest, fs.statSync(file).mtimeMs);
    return newest;
  }

  static list(dir) {
    return FileTree._walk(dir, new Set()).map((f) => path.relative(dir, f).split(path.sep).join('/'));
  }

  static _walk(dir, skip, out = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) FileTree._walk(p, skip, out);
      else out.push(p);
    }
    return out;
  }
}

module.exports = FileTree;
