class TraceTable {
  static fileRow(f) {
    return `${TraceTable.pad(f.id, 40)} ${TraceTable.pad(TraceTable.kb(f.size), 10)} ${new Date(f.mtime).toISOString()}`;
  }

  static header() {
    const pad = TraceTable.pad;
    return `${pad('#', 4)} ${pad('turn', 5)} ${pad('type', 9)} ${pad('model', 28)} ${pad('tokens', 13)} ${pad('ttft', 8)} ${pad('total', 9)} response`;
  }

  static callRow(r) {
    const pad = TraceTable.pad;
    const u = r.usage || {};
    const tokens = `${TraceTable.num(u.promptTokens)}/${TraceTable.num(u.completionTokens)}`;
    const timing = r.timing || {};
    return `${pad(r._index, 4)} ${pad(r._turn, 5)} ${pad(r.callType, 9)} ${pad(r.model, 28)} ${pad(tokens, 13)} `
      + `${pad(TraceTable.ms(timing.ttftMs), 8)} ${pad(TraceTable.ms(timing.totalMs), 9)} ${TraceTable.firstLine(TraceTable._responseText(r.response || {}), 80)}`;
  }

  static turnIndex(records) {
    const order = [];
    for (const r of records) {
      const t = r.turnId || '(none)';
      if (!order.includes(t)) order.push(t);
    }
    return (r) => order.indexOf(r.turnId || '(none)') + 1;
  }

  static pad(s, n) {
    return String(s == null ? '' : s).padEnd(n).slice(0, n);
  }

  static num(v) {
    return v == null ? '-' : String(v);
  }

  static ms(v) {
    return v == null ? '-' : `${Math.round(v)}ms`;
  }

  static kb(n) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  static firstLine(s, n) {
    const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
  }

  static _responseText(resp) {
    if (resp.error) return `ERROR ${resp.error}`;
    const calls = resp.toolCalls && resp.toolCalls.length ? `[${resp.toolCalls.length} tool call(s)] ` : '';
    return calls + (resp.text || '');
  }
}

module.exports = TraceTable;
