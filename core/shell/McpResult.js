class McpResult {
  static text(data) {
    return {
      content: [McpResult._textBlock(data)],
      structuredContent: data,
    };
  }

  static error(message) {
    return {
      content: [McpResult._textBlock({ success: false, error: message })],
      isError: true,
    };
  }

  static _textBlock(data) {
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
}

module.exports = McpResult;
