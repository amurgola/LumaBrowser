class ToolReply {
  static done(data) {
    const body = { success: true, data };
    return { content: [ToolReply._text(body)], structuredContent: body };
  }

  static error(message) {
    return { content: [ToolReply._text({ success: false, error: message })], isError: true };
  }

  static lines(text) {
    return { content: [{ type: 'text', text }] };
  }

  static image(png, caption) {
    return { content: [{ type: 'image', data: png.toString('base64'), mimeType: 'image/png' }, { type: 'text', text: caption }] };
  }

  static _text(data) {
    return { type: 'text', text: JSON.stringify(data, null, 2) };
  }
}

module.exports = ToolReply;
