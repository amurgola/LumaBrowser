const fs = require('fs');
const path = require('path');

class GitExclude {
  static addOnce(root, pattern, comment) {
    try {
      const gitDir = path.join(root, '.git');
      if (!GitExclude._isDirectory(gitDir)) return;
      const excludeFile = path.join(gitDir, 'info', 'exclude');
      const current = GitExclude._readOrEmpty(excludeFile);
      if (current.split(/\r?\n/).some((line) => line.trim() === pattern)) return;
      GitExclude._append(excludeFile, current, comment, pattern);
    } catch (_) {}
  }

  static _append(excludeFile, current, comment, pattern) {
    fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
    const separator = current && !current.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(excludeFile, `${separator}# ${comment}\n${pattern}\n`);
  }

  static _isDirectory(dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  }

  static _readOrEmpty(file) {
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (_) {
      return '';
    }
  }
}

module.exports = GitExclude;
