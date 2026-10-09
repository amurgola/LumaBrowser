class ResponsesContent {
  static TEXT_TYPES = ['input_text', 'output_text', 'text', 'refusal', 'summary_text', 'reasoning_text'];

  static text(content, separator = '\n') {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    return content.map((part) => ResponsesContent._partText(part)).filter((text) => text !== null).join(separator);
  }

  static userContent(content) {
    if (typeof content === 'string') return content;
    const parts = (Array.isArray(content) ? content : []).map((part) => ResponsesContent._userPart(part)).filter(Boolean);
    if (parts.every((part) => part.type === 'text')) return parts.map((part) => part.text).join('\n');
    return parts;
  }

  static toolOutput(output) {
    if (output == null) return '';
    if (typeof output === 'string') return output;
    if (Array.isArray(output)) return output.map((part) => ResponsesContent._toolPartText(part)).join('\n');
    if (typeof output.content === 'string') return output.content;
    return JSON.stringify(output);
  }

  static _partText(part) {
    if (typeof part === 'string') return part;
    if (!part || !ResponsesContent.TEXT_TYPES.includes(part.type)) return null;
    return String(part.text != null ? part.text : (part.refusal || ''));
  }

  static _userPart(part) {
    const text = ResponsesContent._partText(part);
    if (text !== null) return { type: 'text', text };
    if (!part || typeof part !== 'object') return null;
    if (part.type === 'input_image') return ResponsesContent._imagePart(part);
    if (part.type === 'input_file') return { type: 'text', text: `[file attached${part.filename ? `: ${part.filename}` : ''}]` };
    return null;
  }

  static _imagePart(part) {
    const url = typeof part.image_url === 'string' ? part.image_url : (part.image_url && part.image_url.url);
    return url ? { type: 'image_url', image_url: { url } } : { type: 'text', text: '[image]' };
  }

  static _toolPartText(part) {
    const text = ResponsesContent._partText(part);
    if (text !== null) return text;
    if (part && part.type === 'input_image') return '[image]';
    return JSON.stringify(part);
  }
}

module.exports = ResponsesContent;
