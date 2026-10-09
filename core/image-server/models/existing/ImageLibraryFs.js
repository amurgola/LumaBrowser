const fs = require('fs');
const os = require('os');
const path = require('path');

class ImageLibraryFs {
  static statOrNull(p) {
    try {
      return fs.statSync(p);
    } catch (_) {
      return null;
    }
  }

  static isDir(p) {
    const st = ImageLibraryFs.statOrNull(p);
    return !!(st && st.isDirectory());
  }

  static listDirs(dir) {
    try {
      return fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(dir, e.name));
    } catch (_) {
      return [];
    }
  }

  static firstDir(dir, names) {
    for (const name of names) {
      const p = path.join(dir, name);
      if (ImageLibraryFs.isDir(p)) return p;
    }
    return null;
  }

  static homedir() {
    try {
      return os.homedir();
    } catch (_) {
      return null;
    }
  }

  static realPathOr(p, fallback) {
    try {
      return fs.realpathSync(p);
    } catch (_) {
      return fallback;
    }
  }
}

module.exports = ImageLibraryFs;
