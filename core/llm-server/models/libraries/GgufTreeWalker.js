const path = require('path');
const FileProbe = require('./FileProbe');

class GgufTreeWalker {
  static SHARD = /-(\d{5})-of-(\d{5})\.gguf$/i;

  static COMPANION = /^(?:mmproj|dflash|mtp[-_])/i;

  static walk(root, maxDepth, minBytes) {
    const found = [];
    GgufTreeWalker._walk(root, maxDepth, minBytes, 0, found);
    return found;
  }

  static _walk(dir, maxDepth, minBytes, depth, found) {
    if (depth > maxDepth) return;
    for (const entry of FileProbe.readDirectory(dir)) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) GgufTreeWalker._walk(full, maxDepth, minBytes, depth + 1, found);
      else if (entry.isFile() && GgufTreeWalker.isAdoptableName(entry.name)) GgufTreeWalker._addIfBigEnough(full, entry.name, minBytes, found);
    }
  }

  static isAdoptableName(fileName) {
    if (!/\.gguf$/i.test(fileName)) return false;
    const shard = GgufTreeWalker.SHARD.exec(fileName);
    if (shard && shard[1] !== '00001') return false;
    return !GgufTreeWalker.COMPANION.test(fileName);
  }

  static _addIfBigEnough(full, fileName, minBytes, found) {
    const bytes = FileProbe.sizeIfAtLeast(full, minBytes);
    if (bytes != null) found.push({ path: full, bytes, file: fileName });
  }
}

module.exports = GgufTreeWalker;
