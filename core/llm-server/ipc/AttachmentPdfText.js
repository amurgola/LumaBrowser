const fs = require('fs');

class AttachmentPdfText {
  static MODULE_PATH = 'pdfjs-dist/legacy/build/pdf.mjs';
  static _module = null;

  static async extract(filePath, { load = AttachmentPdfText._load } = {}) {
    const pdfjs = await load();
    const doc = await pdfjs.getDocument(AttachmentPdfText._documentOptions(filePath)).promise;
    try {
      return AttachmentPdfText.joinPages(await AttachmentPdfText._pageTexts(doc));
    } finally {
      await AttachmentPdfText._release(doc);
    }
  }

  static pageText(items) {
    return (items || []).map((it) => (it && it.str) || '').join(' ').replace(/\s+/g, ' ').trim();
  }

  static joinPages(pageTexts) {
    return pageTexts.filter(Boolean).join('\n\n');
  }

  static _documentOptions(filePath) {
    const raw = fs.readFileSync(filePath);
    const data = new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    return { data, disableFontFace: true, useSystemFonts: true, verbosity: 0 };
  }

  static async _pageTexts(doc) {
    const texts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      texts.push(AttachmentPdfText.pageText(content.items));
      try { page.cleanup(); } catch (_) {}
    }
    return texts;
  }

  static async _release(doc) {
    try { await doc.cleanup(); } catch (_) {}
    try { await doc.destroy(); } catch (_) {}
  }

  static async _load() {
    if (!AttachmentPdfText._module) {
      try {
        AttachmentPdfText._module = require(AttachmentPdfText.MODULE_PATH);
      } catch (_) {
        AttachmentPdfText._module = await import(AttachmentPdfText.MODULE_PATH);
      }
    }
    return AttachmentPdfText._module;
  }
}

module.exports = AttachmentPdfText;
