const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const FileSelection = require('../file-actions/FileSelection');

class LumabyteFiles {
  static TEXT_CHARS = 40000;
  static READ_BYTES = 256 * 1024;
  static PDF_MAX = 20 * 1024 * 1024;
  static LIST_MAX = 200;
  static FOLDER_TIMEOUT_MS = 6000;
  static EXPLORER_EXES = new Set(['explorer.exe']);

  static FOLDER_SCRIPT = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
$out = @()
foreach ($w in (New-Object -ComObject Shell.Application).Windows()) {
  try {
    $f = $w.Document.Folder.Self.Path
    if (-not $f) { continue }
    $sel = @($w.Document.SelectedItems() | ForEach-Object { $_.Path })
    $out += [pscustomobject]@{ hwnd = [int64]$w.HWND; path = $f; name = [string]$w.LocationName; selected = $sel }
  } catch { }
}
ConvertTo-Json -InputObject @($out) -Compress -Depth 3`;

  constructor({ exec = execFile, fsImpl = fs, pdfText = null, platform = process.platform } = {}) {
    this._exec = exec;
    this._fs = fsImpl;
    this._pdfText = pdfText;
    this._platform = platform;
  }

  async folderOf(hwnd, { exe = '', title = '' } = {}) {
    if (this._platform !== 'win32' || !LumabyteFiles.EXPLORER_EXES.has(String(exe).toLowerCase())) return null;
    let list;
    try {
      list = JSON.parse(await this._powershell(LumabyteFiles.FOLDER_SCRIPT) || '[]');
    } catch (_) {
      return null;
    }
    const mine = (Array.isArray(list) ? list : [list]).filter((w) => w && Number(w.hwnd) === Number(hwnd) && /^[a-zA-Z]:[\\/]/.test(String(w.path || '')));
    if (!mine.length) return null;
    const t = String(title).toLowerCase();
    const pick = mine.find((w) => w.name && t.startsWith(String(w.name).toLowerCase())) || mine[0];
    return { folder: pick.path, selected: (pick.selected || []).filter((p) => typeof p === 'string') };
  }

  resolve(target, folder) {
    const raw = String(target || '').trim().replace(/^["']|["']$/g, '');
    if (!raw) return { error: 'No file named' };
    const lib = this._platform === 'win32' ? path.win32 : path.posix;
    const absolute = this._platform === 'win32' ? /^([a-zA-Z]:[\\/]|[\\/]{2})/.test(raw) : lib.isAbsolute(raw);
    let full = raw;
    if (!absolute) {
      if (!folder) return { error: `"${raw}" is not a full path and no folder is open` };
      full = lib.join(folder, raw);
    }
    const problem = FileSelection.pathProblem(full, { platform: this._platform });
    return problem ? { error: problem } : { path: lib.normalize(full) };
  }

  async read(target, { folder = null } = {}) {
    const r = this.resolve(target, folder);
    if (r.error) return { ok: false, error: r.error };
    const full = r.path;
    let stat;
    try {
      stat = this._fs.statSync(full);
    } catch (err) {
      return { ok: false, error: err && err.code === 'ENOENT' ? `Not found: ${full}` : `Cannot read ${full}` };
    }
    try {
      if (stat.isDirectory()) return { ok: true, name: path.basename(full) || full, text: this._listing(full) };
      if (!stat.isFile()) return { ok: false, error: 'Not a file or folder' };
      return { ok: true, name: path.basename(full), text: await this._file(full, stat.size) };
    } catch (err) {
      return { ok: false, error: (err && err.message) || String(err) };
    }
  }

  _listing(dir) {
    const entries = this._fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
    const lines = entries.slice(0, LumabyteFiles.LIST_MAX).map((e) => {
      if (e.isDirectory()) return `${e.name}\\ (folder)`;
      try {
        const s = this._fs.statSync(path.join(dir, e.name));
        return `${e.name} (${LumabyteFiles.size(s.size)}, modified ${LumabyteFiles.day(s.mtime)})`;
      } catch (_) {
        return e.name;
      }
    });
    const more = entries.length > LumabyteFiles.LIST_MAX ? `\n...and ${entries.length - LumabyteFiles.LIST_MAX} more` : '';
    return `[Folder ${dir}: ${entries.length} item${entries.length === 1 ? '' : 's'}]\n${lines.join('\n') || '(empty)'}${more}`;
  }

  async _file(full, size) {
    const ext = path.extname(full).toLowerCase();
    const head = `[File ${full}, ${LumabyteFiles.size(size)}]`;
    if (ext === '.pdf') {
      if (size > LumabyteFiles.PDF_MAX) return `${head}\nA PDF too large to read (over 20 MB).`;
      return `${head}\n${LumabyteFiles.cut(await this._pdf().extract(full))}`;
    }
    if (FileSelection.IMAGE_EXTS.has(ext)) return `${head}\nAn image; its contents cannot be read as text. Open it in a window to look at it.`;
    const buf = this._headBytes(full);
    if (LumabyteFiles.binary(buf)) return `${head}\nA binary file (${ext || 'no extension'}); it has no readable text.`;
    const text = buf.toString('utf8').replace(/�+$/, '');
    const partial = size > buf.length;
    return `${head}\n${LumabyteFiles.cut(text, partial)}`;
  }

  _headBytes(full) {
    const fd = this._fs.openSync(full, 'r');
    try {
      const buf = Buffer.alloc(LumabyteFiles.READ_BYTES);
      const n = this._fs.readSync(fd, buf, 0, buf.length, 0);
      return buf.subarray(0, n);
    } finally {
      this._fs.closeSync(fd);
    }
  }

  _pdf() {
    return this._pdfText || require('../../../../core/llm-server/ipc/AttachmentPdfText');
  }

  _powershell(script) {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    return new Promise((resolve, reject) => {
      this._exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { timeout: LumabyteFiles.FOLDER_TIMEOUT_MS, windowsHide: true, encoding: 'utf8' }, (err, stdout) => (err ? reject(err) : resolve(String(stdout || '').trim())));
    });
  }

  static binary(buf) {
    return buf.subarray(0, 8192).includes(0);
  }

  static cut(text, partial = false) {
    const t = String(text || '');
    if (t.length > LumabyteFiles.TEXT_CHARS) return `${t.slice(0, LumabyteFiles.TEXT_CHARS)}\n...(cut: only the first ${Math.round(LumabyteFiles.TEXT_CHARS / 1000)}k characters)`;
    return partial ? `${t}\n...(cut: only the start of the file)` : t || '(empty file)';
  }

  static size(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  static day(d) {
    const t = d instanceof Date ? d : new Date(d);
    return Number.isNaN(t.getTime()) ? 'unknown' : t.toISOString().slice(0, 10);
  }
}

module.exports = LumabyteFiles;
