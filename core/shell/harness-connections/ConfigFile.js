const fs = require('fs');
const path = require('path');

class ConfigFile {
  static readTextOr(file, fallback) {
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (err) {
      if (err && err.code === 'ENOENT') return fallback;
      throw err;
    }
  }

  static writeAtomic(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, contents, 'utf8');
    try {
      fs.renameSync(tmp, file);
    } catch (err) {
      ConfigFile._writeInPlace(file, tmp, contents, err);
    }
  }

  static remove(file) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      if (!err || err.code !== 'ENOENT') throw err;
    }
  }

  static _writeInPlace(file, tmp, contents, renameError) {
    try {
      fs.writeFileSync(file, contents, 'utf8');
    } finally {
      try { fs.unlinkSync(tmp); } catch (_) {}
    }
    if (!fs.existsSync(file)) throw renameError;
  }
}

module.exports = ConfigFile;
