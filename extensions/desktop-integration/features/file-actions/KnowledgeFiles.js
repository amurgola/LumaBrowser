const fs = require('fs');
const path = require('path');
const DocumentParser = require('../../../../core/rag/DocumentParser');

class KnowledgeFiles {
  static MAX_DEPTH = 4;
  static MAX_FILE_BYTES = 20 * 1024 * 1024;
  static SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', 'dist', 'build', 'out', 'target', 'bin', 'obj', '$recycle.bin']);

  static async collect(items, { maxFiles = 200, fsImpl = fs.promises } = {}) {
    const files = [];
    const seen = new Set();
    let skipped = 0;
    let truncated = false;
    const add = (p) => {
      const key = p.toLowerCase();
      if (seen.has(key)) return true;
      if (files.length >= maxFiles) { truncated = true; return false; }
      seen.add(key);
      files.push(p);
      return true;
    };
    for (const item of items) {
      if (item.kind !== 'folder') {
        if (DocumentParser.isSupported(item.path) && item.size <= KnowledgeFiles.MAX_FILE_BYTES) add(item.path);
        else skipped += 1;
        continue;
      }
      const walked = await KnowledgeFiles._walk(item.path, { fsImpl, add });
      skipped += walked.skipped;
      if (walked.stopped) { truncated = true; break; }
    }
    return { files, skipped, truncated };
  }

  static async _walk(root, { fsImpl, add }) {
    let skipped = 0;
    const queue = [{ dir: root, depth: 0 }];
    while (queue.length) {
      const { dir, depth } = queue.shift();
      let entries;
      try {
        entries = await fsImpl.readdir(dir, { withFileTypes: true });
      } catch (_) {
        skipped += 1;
        continue;
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (depth + 1 <= KnowledgeFiles.MAX_DEPTH && !KnowledgeFiles.SKIP_DIRS.has(entry.name.toLowerCase())) queue.push({ dir: full, depth: depth + 1 });
          continue;
        }
        if (!entry.isFile() || !DocumentParser.isSupported(full)) continue;
        if (!(await KnowledgeFiles._sizeOk(full, fsImpl))) { skipped += 1; continue; }
        if (!add(full)) return { skipped, stopped: true };
      }
    }
    return { skipped, stopped: false };
  }

  static async _sizeOk(full, fsImpl) {
    try {
      const stat = await fsImpl.stat(full);
      return stat.size > 0 && stat.size <= KnowledgeFiles.MAX_FILE_BYTES;
    } catch (_) {
      return false;
    }
  }
}

module.exports = KnowledgeFiles;
