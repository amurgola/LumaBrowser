const fs = require('fs');

class PartialFile {
  static SUFFIX = '.partial';

  static pathFor(destPath) {
    return destPath + PartialFile.SUFFIX;
  }

  static size(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (_) {
      return 0;
    }
  }
}

module.exports = PartialFile;
