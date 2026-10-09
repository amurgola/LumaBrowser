const fs = require('fs');
const path = require('path');
const AttachmentPdfText = require('./AttachmentPdfText');

class AttachmentReader {
  static TEXT_EXTS = new Set([
    '.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.jsonl', '.yaml', '.yml',
    '.toml', '.ini', '.log', '.xml', '.html', '.css', '.js', '.mjs', '.ts', '.tsx',
    '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.c', '.cc', '.cpp',
    '.h', '.hpp', '.cs', '.sh', '.bash', '.zsh', '.sql', '.r', '.lua', '.php', '.dart',
  ]);
  static IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
  static IMAGE_MIME = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  static TEXT_MAX = 200 * 1024;
  static IMAGE_MAX = 8 * 1024 * 1024;
  static PDF_MAX = 20 * 1024 * 1024;

  constructor({ pdfText = AttachmentPdfText } = {}) {
    this._pdfText = pdfText;
  }

  async read(paths) {
    const files = [];
    for (const filePath of paths) files.push(await this._readOne(filePath));
    return files;
  }

  async _readOne(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      return { name, error: 'Could not read file: ' + err.message };
    }
    if (stat.isDirectory()) return { name, error: 'Folders cannot be attached. Drop the files inside it instead.' };
    if (AttachmentReader.IMAGE_EXTS.has(ext)) return AttachmentReader._image(filePath, name, ext, stat.size);
    if (ext === '.pdf') return this._pdf(filePath, name, stat.size);
    return AttachmentReader._text(filePath, name, ext, stat.size);
  }

  static _image(filePath, name, ext, size) {
    if (size > AttachmentReader.IMAGE_MAX) {
      return { name, size, kind: 'image', error: 'Image is too large (max ' + Math.round(AttachmentReader.IMAGE_MAX / 1024 / 1024) + ' MB).' };
    }
    const mime = AttachmentReader.IMAGE_MIME[ext] || 'image/jpeg';
    return { name, size, kind: 'image', mime, base64: fs.readFileSync(filePath).toString('base64') };
  }

  async _pdf(filePath, name, size) {
    if (size > AttachmentReader.PDF_MAX) return { name, size, kind: 'pdf', error: 'PDF is too large (max 20 MB).' };
    try {
      return AttachmentReader._pdfEntry(name, size, await this._pdfText.extract(filePath));
    } catch (err) {
      return { name, size, kind: 'pdf', error: 'PDF text extraction failed: ' + ((err && err.message) || err) };
    }
  }

  static _pdfEntry(name, size, text) {
    if (text.length <= AttachmentReader.TEXT_MAX) return { name, size, kind: 'pdf', language: 'text', text };
    const note = '\n\n…(truncated: original extraction was ' + Math.round(text.length / 1024) + ' KB)';
    return { name, size, kind: 'pdf', language: 'text', text: text.slice(0, AttachmentReader.TEXT_MAX) + note, truncated: true };
  }

  static _text(filePath, name, ext, size) {
    if (size > AttachmentReader.TEXT_MAX) {
      return { name, size, kind: 'text', error: 'Text file is too large (max ' + Math.round(AttachmentReader.TEXT_MAX / 1024) + ' KB).' };
    }
    try {
      return { name, size, kind: 'text', language: ext.replace(/^\./, ''), text: fs.readFileSync(filePath, 'utf8') };
    } catch (err) {
      return { name, error: 'Could not decode as UTF-8 text: ' + err.message };
    }
  }
}

module.exports = AttachmentReader;
