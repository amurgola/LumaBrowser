class AnthropicContent {
  static DEFAULT_IMAGE_TYPE = 'image/png';

  static systemText(system) {
    if (typeof system === 'string') return system;
    if (!Array.isArray(system)) return '';
    return system
      .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('\n\n');
  }

  static toolResultText(content) {
    if (content == null) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((block) => AnthropicContent._toolResultBlockText(block)).join('\n');
    return JSON.stringify(content);
  }

  static imagePart(block) {
    const source = block && block.source;
    if (!source || typeof source !== 'object') return null;
    if (source.type === 'base64' && source.data) {
      return AnthropicContent._imageUrl(`data:${source.media_type || AnthropicContent.DEFAULT_IMAGE_TYPE};base64,${source.data}`);
    }
    if (source.type === 'url' && source.url) return AnthropicContent._imageUrl(source.url);
    return null;
  }

  static _toolResultBlockText(block) {
    if (!block || typeof block !== 'object') return String(block);
    if (block.type === 'text') return String(block.text || '');
    if (block.type === 'image') return '[image]';
    return JSON.stringify(block);
  }

  static _imageUrl(url) {
    return { type: 'image_url', image_url: { url } };
  }
}

module.exports = AnthropicContent;
