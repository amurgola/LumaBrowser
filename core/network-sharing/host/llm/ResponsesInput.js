class ResponsesInput {
  static DATA_URL_PATTERN = /^data:([^;,]+);base64,(.+)$/;

  static toMessages(body) {
    const messages = ResponsesInput._instructions(body);
    const images = [];
    const input = body.input;
    if (typeof input === 'string') return { messages: [...messages, { role: 'user', content: input }], images };
    if (!Array.isArray(input)) return { messages: null, images };
    for (const item of input) ResponsesInput._addItem(item, messages, images);
    return { messages, images };
  }

  static _instructions(body) {
    const text = body.instructions;
    return typeof text === 'string' && text.trim() ? [{ role: 'system', content: text }] : [];
  }

  static _addItem(item, messages, images) {
    if (!item || typeof item !== 'object') return;
    if (item.type && item.type !== 'message') return;
    const role = item.role || 'user';
    if (typeof item.content === 'string') {
      messages.push({ role, content: item.content });
      return;
    }
    if (!Array.isArray(item.content)) return;
    const texts = ResponsesInput._collectParts(item.content, images);
    if (texts.length) messages.push({ role, content: texts.join('\n') });
  }

  static _collectParts(parts, images) {
    const texts = [];
    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      if (typeof part.text === 'string') texts.push(part.text);
      else ResponsesInput._addImage(part, images);
    }
    return texts;
  }

  static _addImage(part, images) {
    if (part.type !== 'input_image' || typeof part.image_url !== 'string') return;
    const match = ResponsesInput.DATA_URL_PATTERN.exec(part.image_url);
    if (match) images.push({ name: 'input_image', mime: match[1], base64: match[2] });
  }
}

module.exports = ResponsesInput;
