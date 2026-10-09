class AnthropicMessageConverter {
  static DATA_URL_IMAGE = /^data:(image\/[^;]+);base64,(.+)$/;

  static convert(messages) {
    const system = messages.filter((m) => m.role === 'system').map(AnthropicMessageConverter._systemText)
      .reduce((joined, text) => joined + (joined ? '\n\n' : '') + text, '');
    const converted = messages.filter((m) => m.role !== 'system').map(AnthropicMessageConverter._message);
    return { system, messages: converted };
  }

  static _systemText(message) {
    return typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  }

  static _message(message) {
    return {
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: AnthropicMessageConverter._content(message.content),
    };
  }

  static _content(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(AnthropicMessageConverter._part);
    return String(content);
  }

  static _part(part) {
    if (part.type === 'text') return { type: 'text', text: part.text };
    const image = AnthropicMessageConverter._imageBlock(part);
    return image || { type: 'text', text: JSON.stringify(part) };
  }

  static _imageBlock(part) {
    if (part.type !== 'image_url' || !part.image_url?.url) return null;
    const match = part.image_url.url.match(AnthropicMessageConverter.DATA_URL_IMAGE);
    if (!match) return null;
    return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
  }
}

module.exports = AnthropicMessageConverter;
