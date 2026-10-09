const fs = require('fs');

class PdfTextExtractor {
  static MODULE_PATH = 'pdfjs-dist/legacy/build/pdf.mjs';
  static LINE_GAP = 6;

  static async extract(filePath) {
    const pdfjs = await PdfTextExtractor._loadPdfjs();
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
    const pages = await PdfTextExtractor._readPages(doc);
    await PdfTextExtractor._destroy(doc);
    return pages.filter((page) => page.text);
  }

  static async _loadPdfjs() {
    try {
      return require(PdfTextExtractor.MODULE_PATH);
    } catch (_) {
      return import(PdfTextExtractor.MODULE_PATH);
    }
  }

  static async _readPages(doc) {
    const pages = [];
    for (let number = 1; number <= doc.numPages; number++) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      pages.push({ page: number, text: PdfTextExtractor.joinItems(content.items) });
      page.cleanup();
    }
    return pages;
  }

  static joinItems(items) {
    let text = '';
    let lastY = null;
    for (const item of items) {
      const y = item.transform ? item.transform[5] : null;
      if (lastY != null && y != null && Math.abs(y - lastY) > PdfTextExtractor.LINE_GAP) text += '\n';
      text += item.str || '';
      if (item.hasEOL) text += '\n';
      lastY = y;
    }
    return text.replace(/[ \t]+\n/g, '\n').trim();
  }

  static async _destroy(doc) {
    try {
      await doc.destroy();
    } catch (_) {}
  }
}

module.exports = PdfTextExtractor;
