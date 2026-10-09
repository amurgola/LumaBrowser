class WslFormat {
  static DEFAULT_KILL_PATTERN = 'sgl-omni';

  static toWslPath(winPath) {
    const text = String(winPath || '');
    const match = text.match(/^([A-Za-z]):[\\/](.*)$/);
    if (!match) return text.replace(/\\/g, '/');
    return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, '/')}`;
  }

  static shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
  }

  static killPortCommand(port, pattern = WslFormat.DEFAULT_KILL_PATTERN) {
    const portNumber = Number(port);
    const name = String(pattern || WslFormat.DEFAULT_KILL_PATTERN).replace(/[^A-Za-z0-9_.-]/g, '');
    return `fuser -k ${portNumber}/tcp 2>/dev/null || pkill -f '${name}.*--port ${portNumber}' || true`;
  }

  static parseList(text) {
    const rows = [];
    for (const line of String(text || '').split(/\r?\n/).slice(1)) {
      const match = line.match(/^\s*(\*)?\s*(\S(?:.*\S)?)\s+(\S+)\s+(\d+)\s*$/);
      if (match) rows.push({ isDefault: !!match[1], name: match[2], state: match[3], version: Number(match[4]) });
    }
    return rows;
  }

  static decodeOutput(buffer) {
    if (!buffer || buffer.length === 0) return '';
    if (!Buffer.isBuffer(buffer)) return String(buffer);
    const encoding = WslFormat._looksUtf16(buffer) ? 'utf16le' : 'utf8';
    return buffer.toString(encoding).replace(/\u0000/g, '').trim();
  }

  static _looksUtf16(buffer) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 64));
    let nuls = 0;
    for (const byte of sample) if (byte === 0) nuls++;
    return nuls > sample.length / 4;
  }
}

module.exports = WslFormat;
