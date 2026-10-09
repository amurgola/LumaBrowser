const fs = require('fs');
const path = require('path');
const HtmlToMarkdown = require('../shared/content/HtmlToMarkdown');
const PdfTextExtractor = require('./PdfTextExtractor');

class DocumentParser {
  static READERS = new Map([
    ['.md', 'text'], ['.markdown', 'text'], ['.txt', 'text'], ['.text', 'text'],
    ['.html', 'html'], ['.htm', 'html'], ['.xhtml', 'html'],
    ['.pdf', 'pdf'],
  ]);

  static supportedExtensions() {
    return [...DocumentParser.READERS.keys()];
  }

  static isSupported(filePath) {
    return DocumentParser.READERS.has(DocumentParser._extensionOf(filePath));
  }

  static async parse(filePath) {
    const reader = DocumentParser._readerFor(filePath);
    if (reader === 'pdf') return PdfTextExtractor.extract(filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    if (reader === 'html') return DocumentParser._htmlPages(raw);
    return DocumentParser._textPages(raw);
  }

  static _extensionOf(filePath) {
    return path.extname(String(filePath || '')).toLowerCase();
  }

  static _readerFor(filePath) {
    const extension = DocumentParser._extensionOf(filePath);
    if (DocumentParser.READERS.has(extension)) return DocumentParser.READERS.get(extension);
    throw new Error(`Unsupported file type "${extension}". Supported: ${DocumentParser.supportedExtensions().join(', ')}.`);
  }

  static _htmlPages(raw) {
    const text = HtmlToMarkdown.convert(raw);
    return text.trim() ? [{ page: 1, text }] : [];
  }

  static _textPages(raw) {
    const text = String(raw).replace(/\r\n/g, '\n').trim();
    return text ? [{ page: 1, text }] : [];
  }
}

module.exports = DocumentParser;
