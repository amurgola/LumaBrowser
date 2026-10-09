const fs = require('fs');

class FileProbe {
  static stat(filePath) {
    try {
      return fs.statSync(filePath);
    } catch (_) {
      return null;
    }
  }

  static isDirectory(filePath) {
    const stats = FileProbe.stat(filePath);
    return !!(stats && stats.isDirectory());
  }

  static sizeIfAtLeast(filePath, minBytes) {
    const stats = FileProbe.stat(filePath);
    return (stats && stats.isFile() && stats.size >= minBytes) ? stats.size : null;
  }

  static readDirectory(dirPath) {
    try {
      return fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (_) {
      return [];
    }
  }

  static realPath(filePath) {
    try {
      return fs.realpathSync(filePath);
    } catch (_) {
      return filePath;
    }
  }
}

module.exports = FileProbe;
