class ChatErrorBody {
  static MAX_READ = 4096;
  static MAX_LINE = 600;
  static READ_TIMEOUT_MS = 2000;

  static async read(data) {
    try {
      const text = String(await ChatErrorBody._text(data)).trim();
      if (!text) return '';
      return ChatErrorBody._envelopeMessage(text) || text.replace(/\s+/g, ' ').slice(0, ChatErrorBody.MAX_LINE);
    } catch (_) {
      return '';
    }
  }

  static _text(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data.on === 'function') return ChatErrorBody._drain(data);
    if (typeof data === 'object') return JSON.stringify(data);
    return '';
  }

  static _drain(stream) {
    return new Promise((resolve) => {
      let text = '';
      let settled = false;
      const done = () => { if (!settled) { settled = true; resolve(text); } };
      stream.on('data', (chunk) => {
        text += chunk.toString('utf8');
        if (text.length >= ChatErrorBody.MAX_READ) { text = text.slice(0, ChatErrorBody.MAX_READ); done(); }
      });
      stream.on('end', done);
      stream.on('error', done);
      const timer = setTimeout(done, ChatErrorBody.READ_TIMEOUT_MS);
      if (timer.unref) timer.unref();
    });
  }

  static _envelopeMessage(text) {
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { return null; }
    const message = (parsed && parsed.error && (parsed.error.message || parsed.error)) || (parsed && parsed.message);
    if (!message) return null;
    return String(typeof message === 'string' ? message : JSON.stringify(message)).slice(0, ChatErrorBody.MAX_LINE);
  }
}

module.exports = ChatErrorBody;
