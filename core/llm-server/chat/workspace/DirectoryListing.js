const fs = require('fs');
const path = require('path');

class DirectoryListing {
  static MAX_ENTRIES = 2000;

  static list(absDir, relDir) {
    let dirents;
    try {
      dirents = fs.readdirSync(absDir, { withFileTypes: true });
    } catch (err) {
      return { success: false, error: err.message };
    }
    const entries = dirents.slice(0, DirectoryListing.MAX_ENTRIES)
      .map((d) => DirectoryListing._entry(absDir, relDir, d))
      .filter(Boolean)
      .sort(DirectoryListing._dirsFirstByName);
    return { success: true, dir: relDir, truncated: dirents.length > DirectoryListing.MAX_ENTRIES, entries };
  }

  static _entry(absDir, relDir, dirent) {
    const absPath = path.join(absDir, dirent.name);
    const type = DirectoryListing._typeOf(dirent, absPath);
    if (!type) return null;
    return {
      name: dirent.name,
      path: relDir ? `${relDir}/${dirent.name}` : dirent.name,
      type,
      size: type === 'file' ? DirectoryListing._sizeOf(absPath) : 0,
    };
  }

  static _typeOf(dirent, absPath) {
    if (!dirent.isSymbolicLink()) return dirent.isDirectory() ? 'dir' : 'file';
    try {
      return fs.statSync(absPath).isDirectory() ? 'dir' : 'file';
    } catch (_) {
      return null;
    }
  }

  static _sizeOf(absPath) {
    try {
      return fs.statSync(absPath).size;
    } catch (_) {
      return 0;
    }
  }

  static _dirsFirstByName(a, b) {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }
}

module.exports = DirectoryListing;
