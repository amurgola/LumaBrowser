const fs = require('fs');
const path = require('path');
const FileGlobMatcher = require('./FileGlobMatcher');

class FolderScanner {
  static MAX_ENTRIES = 20000;
  static MAX_DEPTH = 6;

  static async scan(dir, { recursive = false, matches } = {}) {
    const state = { dir, recursive, matches, files: new Map(), entries: 0, overflow: false };
    await FolderScanner._walk(dir, 0, state);
    return { files: state.files, overflow: state.overflow };
  }

  static async _walk(subdir, depth, state) {
    let dirents;
    try {
      dirents = await fs.promises.readdir(subdir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const dirent of dirents) {
      if (++state.entries > FolderScanner.MAX_ENTRIES) { state.overflow = true; return; }
      const abs = path.join(subdir, dirent.name);
      if (dirent.isDirectory()) {
        if (state.recursive && depth < FolderScanner.MAX_DEPTH && !dirent.isSymbolicLink()) await FolderScanner._walk(abs, depth + 1, state);
      } else if (dirent.isFile()) {
        await FolderScanner._record(abs, state);
      }
      if (state.overflow) return;
    }
  }

  static async _record(abs, state) {
    const rel = FileGlobMatcher.toPosix(path.relative(state.dir, abs));
    if (state.matches && !state.matches(rel)) return;
    try {
      const stat = await fs.promises.stat(abs);
      state.files.set(rel, [stat.mtimeMs, stat.size]);
    } catch (_) {}
  }
}

module.exports = FolderScanner;
