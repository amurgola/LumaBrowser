const path = require('path');
const DownloadError = require('./DownloadError');

class SafeRepoPath {
  static DRIVE_OR_UNC = /^(?:[A-Za-z]:|\\\\|\/\/)/;

  static check(remotePath) {
    const raw = String(remotePath == null ? '' : remotePath);
    if (!raw.trim()) throw SafeRepoPath._refuse(raw, 'it is empty');
    if (raw.includes('\0')) throw SafeRepoPath._refuse(raw, 'it contains a NUL byte');
    if (SafeRepoPath.DRIVE_OR_UNC.test(raw) || raw.startsWith('/') || raw.startsWith('\\')) {
      throw SafeRepoPath._refuse(raw, 'it is absolute');
    }
    const segments = raw.split(/[\\/]+/).filter((segment) => segment !== '' && segment !== '.');
    if (segments.length === 0) throw SafeRepoPath._refuse(raw, 'it names no file');
    if (segments.some((segment) => segment === '..')) throw SafeRepoPath._refuse(raw, 'it climbs out of the folder with ".."');
    if (segments.some((segment) => /^[A-Za-z]:$/.test(segment))) throw SafeRepoPath._refuse(raw, 'it contains a drive letter');
    return segments.join('/');
  }

  static fileName(name) {
    const clean = SafeRepoPath.check(name);
    if (clean.includes('/')) throw SafeRepoPath._refuse(name, 'a file name cannot contain a folder');
    return clean;
  }

  static join(destDir, remotePath) {
    const clean = SafeRepoPath.check(remotePath);
    const root = path.resolve(String(destDir));
    const full = path.resolve(root, ...clean.split('/'));
    if (full !== root && !full.startsWith(root + path.sep)) throw SafeRepoPath._refuse(remotePath, 'it escapes the destination folder');
    if (full === root) throw SafeRepoPath._refuse(remotePath, 'it names the destination folder itself');
    return full;
  }

  static isSafe(remotePath) {
    try {
      SafeRepoPath.check(remotePath);
      return true;
    } catch (_) {
      return false;
    }
  }

  static _refuse(remotePath, why) {
    return DownloadError.unsafePath(`Refused the file path "${String(remotePath)}" from the repo: ${why}.`);
  }
}

module.exports = SafeRepoPath;
