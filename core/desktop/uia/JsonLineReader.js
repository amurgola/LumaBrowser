class JsonLineReader {
  constructor() {
    this._buffer = '';
  }

  push(chunk) {
    this._buffer += chunk;
    const messages = [];
    let nl;
    while ((nl = this._buffer.indexOf('\n')) >= 0) {
      const line = this._buffer.slice(0, nl).trim();
      this._buffer = this._buffer.slice(nl + 1);
      const message = JsonLineReader._parse(line);
      if (message !== undefined) messages.push(message);
    }
    return messages;
  }

  static _parse(line) {
    if (!line) return undefined;
    try {
      return JSON.parse(line);
    } catch (_) {
      return undefined;
    }
  }
}

module.exports = JsonLineReader;
