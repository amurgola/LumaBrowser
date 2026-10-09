class McpResultUnwrapper {
  static unwrap(res) {
    const image = res && Array.isArray(res.content) && res.content.find((c) => c && c.type === 'image' && c.data);
    if (image) return McpResultUnwrapper._withImage(res, image);
    const text = res && res.content && res.content[0] && res.content[0].text;
    if (typeof text === 'string') return McpResultUnwrapper._fromText(res, text);
    return { success: !(res && res.isError), data: res };
  }

  static _withImage(res, image) {
    const note = res.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n');
    return { success: !res.isError, message: note || 'Image captured.', imageBase64: image.data, mimeType: image.mimeType || 'image/png' };
  }

  static _fromText(res, text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && 'success' in parsed) return parsed;
      return { success: !(res && res.isError), data: parsed };
    } catch (_) {
      return { success: !(res && res.isError), data: text };
    }
  }
}

module.exports = McpResultUnwrapper;
