const fs = require('fs');

class FileLinker {
  static link(sourcePath, destPath) {
    if (FileLinker._statOrNull(destPath)) return FileLinker._resultForExistingDest(sourcePath, destPath);
    if (FileLinker._tryHardlink(sourcePath, destPath)) return { success: true, mode: 'hardlink' };
    return FileLinker._symlinkOrFail(sourcePath, destPath);
  }

  static isSameFile(a, b) {
    try {
      if (FileLinker._sameInode(FileLinker._statOrNull(a), FileLinker._statOrNull(b))) return true;
      return fs.realpathSync(a) === fs.realpathSync(b);
    } catch (_) {
      return false;
    }
  }

  static _resultForExistingDest(sourcePath, destPath) {
    if (FileLinker.isSameFile(sourcePath, destPath)) return { success: true, mode: 'existing' };
    return { success: false, clash: true, error: 'A different file already exists at that location.' };
  }

  static _tryHardlink(sourcePath, destPath) {
    try {
      fs.linkSync(sourcePath, destPath);
      return true;
    } catch (_) {
      return false;
    }
  }

  static _symlinkOrFail(sourcePath, destPath) {
    try {
      fs.symlinkSync(sourcePath, destPath, 'file');
      return { success: true, mode: 'symlink' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static _sameInode(statA, statB) {
    return Boolean(statA && statB && statA.ino && statA.ino === statB.ino && statA.dev === statB.dev);
  }

  static _statOrNull(filePath) {
    try {
      return fs.statSync(filePath);
    } catch (_) {
      return null;
    }
  }
}

module.exports = FileLinker;
