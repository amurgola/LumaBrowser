class ModelText {
  static json(text) {
    const reply = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    const end = reply.lastIndexOf('}');
    for (let start = reply.indexOf('{'); start >= 0 && start < end; start = reply.indexOf('{', start + 1)) {
      try { return JSON.parse(reply.slice(start, end + 1)); } catch (_) {}
    }
    return null;
  }

  static clip(value, max) {
    const line = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return line.length > max ? `${line.slice(0, max - 3).trimEnd()}...` : line;
  }
}

module.exports = ModelText;
