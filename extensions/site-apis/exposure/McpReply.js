class McpReply {
  static ok(result) {
    return { content: [McpReply._text(result)], structuredContent: result, isError: false };
  }

  static fault(result) {
    return { content: [McpReply._text(result)], isError: true };
  }

  static error(message) {
    return McpReply.fault({ success: false, error: String(message || 'Tool failed.') });
  }

  static _text(data) {
    return { type: 'text', text: JSON.stringify(data) };
  }
}

module.exports = McpReply;
