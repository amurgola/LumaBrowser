const fs = require('fs');
const path = require('path');
const CoreRequire = require('../../CoreRequire');

const FileObservation = CoreRequire.load('shell/FileObservation');

class FileStamp {
  static of(dir, relPath) {
    const abs = path.join(dir, relPath);
    try { return FileObservation.stampOfText(fs.readFileSync(abs, 'utf8')); } catch (_) {}
    try { return FileObservation.stampOf(fs.statSync(abs)); } catch (_) { return null; }
  }
}

module.exports = FileStamp;
