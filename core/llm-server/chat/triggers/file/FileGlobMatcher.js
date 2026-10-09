const path = require('path');
const picomatch = require('picomatch');

class FileGlobMatcher {
  static IGNORE_GLOBS = ['**/~$*', '**/*.tmp', '**/*.crdownload', '**/*.part', '**/*.partial', '**/.~lock*', '**/.DS_Store', '**/Thumbs.db'];

  static create(glob, platform = process.platform) {
    const pattern = String(glob || '*').trim() || '*';
    const nocase = platform === 'win32';
    const matches = picomatch(pattern, { dot: false, nocase });
    const ignored = picomatch(FileGlobMatcher.IGNORE_GLOBS, { dot: true, nocase });
    const byName = !pattern.includes('/');
    return (relPath) => {
      const rel = FileGlobMatcher.toPosix(relPath);
      if (!rel || ignored(rel)) return false;
      return byName ? matches(path.posix.basename(rel)) : matches(rel);
    };
  }

  static toPosix(relPath) {
    return String(relPath || '').split(path.sep).join('/');
  }
}

module.exports = FileGlobMatcher;
