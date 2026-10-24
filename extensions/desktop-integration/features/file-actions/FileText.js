const fs = require('fs');

class FileText {
  static READ_BYTES = 64 * 1024;

  static async extract(item, { pdfText = FileText._pdfText(), fsImpl = fs } = {}) {
    if (item.kind === 'pdf') return FileText.clean(await pdfText.extract(item.path));
    const raw = FileText._head(item.path, fsImpl);
    if (item.ext === '.md' || item.ext === '.markdown') return FileText.clean(FileText.fromMarkdown(raw));
    if (item.ext === '.html' || item.ext === '.htm') return FileText.clean(FileText.fromHtml(raw));
    return FileText.clean(raw);
  }

  static fromMarkdown(text) {
    return String(text)
      .replace(/```[^\n]*\n?/g, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\|?\s*:?-{3,}.*$/gm, '')
      .replace(/(\*\*|__|\*|_|`|~~)/g, '')
      .replace(/<[^>]+>/g, ' ');
  }

  static fromHtml(text) {
    return String(text)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  static clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  static _head(filePath, fsImpl) {
    const fd = fsImpl.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(FileText.READ_BYTES);
      const n = fsImpl.readSync(fd, buf, 0, buf.length, 0);
      return buf.subarray(0, n).toString('utf8').replace(/\uFFFD+$/, '');
    } finally {
      fsImpl.closeSync(fd);
    }
  }

  static _pdfText() {
    return require('../../../../core/llm-server/ipc/AttachmentPdfText');
  }
}

module.exports = FileText;
