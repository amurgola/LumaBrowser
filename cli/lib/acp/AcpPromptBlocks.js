const path = require('path');
const { fileURLToPath } = require('url');

class AcpPromptBlocks {
  static MAX_IMAGE_NAME = 80;

  static toBridgePrompt(blocks) {
    const out = { text: '', images: [], context: [] };
    for (const block of Array.isArray(blocks) ? blocks : []) {
      if (!block || typeof block !== 'object') continue;
      switch (block.type) {
        case 'text': out.text += block.text == null ? '' : String(block.text); break;
        case 'resource_link': out.text += AcpPromptBlocks._mention(block); break;
        case 'resource': AcpPromptBlocks._resource(block, out); break;
        case 'image': AcpPromptBlocks._image(block, out); break;
        default: break;
      }
    }
    out.text = out.text.trim();
    return out;
  }

  static pathOf(uri) {
    const s = String(uri || '');
    if (!s) return '';
    if (s.startsWith('file:')) {
      try { return fileURLToPath(s); } catch (_) { return s.replace(/^file:\/*/, ''); }
    }
    return s;
  }

  static _mention(block) {
    const file = AcpPromptBlocks.pathOf(block.uri) || block.name || '';
    return file ? ` ${file} ` : '';
  }

  static _resource(block, out) {
    const r = block.resource && typeof block.resource === 'object' ? block.resource : null;
    if (!r) return;
    const file = AcpPromptBlocks.pathOf(r.uri);
    if (typeof r.text === 'string') {
      out.context.push({ path: file, text: r.text });
      if (file) out.text += ` ${file} `;
      return;
    }
    if (typeof r.blob === 'string' && /^image\//.test(String(r.mimeType || ''))) {
      out.images.push({ name: AcpPromptBlocks._imageName(file), mime: r.mimeType, base64: r.blob });
    }
  }

  static _image(block, out) {
    if (typeof block.data !== 'string' || !block.data) return;
    out.images.push({ name: AcpPromptBlocks._imageName(AcpPromptBlocks.pathOf(block.uri)), mime: block.mimeType || 'image/png', base64: block.data });
  }

  static _imageName(file) {
    const base = file ? path.basename(file) : '';
    return (base || 'image').slice(0, AcpPromptBlocks.MAX_IMAGE_NAME);
  }
}

module.exports = AcpPromptBlocks;
