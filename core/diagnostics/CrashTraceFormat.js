class CrashTraceFormat {
  static STACK_FRAMES = 8;

  static short(value, max = 160) {
    const s = String(value == null ? '' : value);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  static extra(value) {
    if (value === undefined) return '';
    if (typeof value === 'string') return ` ${value}`;
    try { return ` ${JSON.stringify(value)}`; } catch (_) { return ` ${String(value)}`; }
  }

  static webContentsTag(wc) {
    let type = '?';
    let id = '?';
    try { id = wc.id; } catch (_) {}
    try { type = wc.getType(); } catch (_) {}
    return `wc#${id}(${type})`;
  }

  static stackOf(skip = 1) {
    const first = skip + 1;
    const lines = String(new Error().stack || '').split('\n').slice(first, first + CrashTraceFormat.STACK_FRAMES);
    return lines.map((l) => `    ${l.trim()}`).join('\n');
  }
}

module.exports = CrashTraceFormat;
