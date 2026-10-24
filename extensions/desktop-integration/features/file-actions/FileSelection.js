const fs = require('fs');
const path = require('path');

class FileSelection {
  static MAX_PATHS = 100;
  static IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
  static TEXT_EXTS = new Set([
    '.txt', '.text', '.md', '.markdown', '.csv', '.tsv', '.json', '.jsonl', '.yaml', '.yml',
    '.toml', '.ini', '.log', '.xml', '.html', '.htm', '.css', '.js', '.mjs', '.ts', '.tsx',
    '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.c', '.cc', '.cpp',
    '.h', '.hpp', '.cs', '.sh', '.bash', '.zsh', '.sql', '.r', '.lua', '.php', '.dart',
  ]);

  static async inspect(paths, { allowNetwork = false, fsImpl = fs.promises, platform = process.platform, uid = FileSelection._uid() } = {}) {
    if (!Array.isArray(paths) || !paths.length) return { error: 'paths must be a non-empty array of absolute paths' };
    if (paths.length > FileSelection.MAX_PATHS) return { error: `At most ${FileSelection.MAX_PATHS} paths per request` };
    const items = [];
    const errors = [];
    const seen = new Set();
    for (const raw of paths) {
      if (typeof raw !== 'string' || !raw.trim()) return { error: 'paths must be strings' };
      const problem = FileSelection.pathProblem(raw, { allowNetwork, platform });
      if (problem) { errors.push({ path: raw, error: problem }); continue; }
      const full = FileSelection._normalize(raw, platform);
      const key = platform === 'win32' ? full.toLowerCase() : full;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = await FileSelection._stat(full, { fsImpl, platform, uid });
      if (entry.error) errors.push({ path: raw, error: entry.error });
      else items.push(entry);
    }
    return { items, errors };
  }

  static pathProblem(p, { allowNetwork = false, platform = process.platform } = {}) {
    if (p.length > 32767 || /[\u0000]/.test(p)) return 'Invalid path';
    const lib = platform === 'win32' ? path.win32 : path.posix;
    if (platform === 'win32') {
      if (/^[\\/][\\/][?.][\\/]/.test(p)) return 'Device paths are not accepted';
      if (/^[\\/][\\/]/.test(p)) return allowNetwork ? null : 'Network paths are not accepted (Settings: allow network paths)';
      if (!/^[a-zA-Z]:[\\/]/.test(p)) return 'Path must be absolute';
      return null;
    }
    return lib.isAbsolute(p) ? null : 'Path must be absolute';
  }

  static kindOf(ext, isDirectory) {
    if (isDirectory) return 'folder';
    if (FileSelection.IMAGE_EXTS.has(ext)) return 'image';
    if (ext === '.pdf') return 'pdf';
    if (FileSelection.TEXT_EXTS.has(ext)) return 'text';
    return 'other';
  }

  static _normalize(p, platform) {
    return (platform === 'win32' ? path.win32 : path.posix).normalize(p);
  }

  static async _stat(full, { fsImpl, platform, uid }) {
    const lib = platform === 'win32' ? path.win32 : path.posix;
    const name = lib.basename(full);
    let stat;
    try {
      stat = await fsImpl.stat(full);
    } catch (err) {
      return { error: err && err.code === 'ENOENT' ? 'Not found' : 'Cannot read' };
    }
    if (!stat.isFile() && !stat.isDirectory()) return { error: 'Not a file or folder' };
    if (platform !== 'win32' && uid != null && stat.uid != null && stat.uid !== uid) return { error: 'Not owned by this user' };
    try {
      await fsImpl.access(full, fs.constants.R_OK);
    } catch (_) {
      return { error: 'Cannot read' };
    }
    const isDirectory = stat.isDirectory();
    const ext = isDirectory ? '' : lib.extname(full).toLowerCase();
    return { path: full, name, ext, kind: FileSelection.kindOf(ext, isDirectory), size: isDirectory ? 0 : stat.size };
  }

  static _uid() {
    return typeof process.getuid === 'function' ? process.getuid() : null;
  }
}

module.exports = FileSelection;
