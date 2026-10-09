export default class ToolCardText {
  static PARAM_KEYS = ['path', 'url', 'glob', 'pattern', 'selector', 'query', 'title', 'baseSelector', 'direction', 'key'];

  static detail(tc) {
    if (tc && tc._pending) return ToolCardText._pendingDetail(tc);
    const structured = ToolCardText.metaDetail(tc);
    if (structured) return structured;
    if (tc && tc.summary) return tc.summary;
    const p = (tc && tc.params) || {};
    for (const key of ToolCardText.PARAM_KEYS) {
      if (p[key]) return p[key];
    }
    return '';
  }

  static meta(tc) {
    const m = tc && tc.meta;
    if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
    if (m.kind === 'diff') return ToolCardText._diffMeta(m);
    if (m.kind === 'read') return ToolCardText._readMeta(m);
    return null;
  }

  static metaDetail(tc) {
    const m = ToolCardText.meta(tc);
    if (!m) return '';
    return m.kind === 'diff' ? ToolCardText._diffText(m) : ToolCardText._readText(m);
  }

  static chars(n) {
    const v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    return (v / 1024).toFixed(v < 10240 ? 1 : 0) + ' KB';
  }

  static _pendingDetail(tc) {
    const bits = [];
    if (tc._target) bits.push(String(tc._target));
    if (tc._chars > 0) bits.push(ToolCardText.chars(tc._chars));
    return bits.join(' · ');
  }

  static _diffMeta(m) {
    if (typeof m.path !== 'string' || !m.path) return null;
    if (m.noBasis) return { kind: 'diff', path: m.path, created: !!m.created, noBasis: true };
    if (!Number.isInteger(m.added) || !Number.isInteger(m.removed)) return null;
    if (m.added < 0 || m.removed < 0) return null;
    if (!Array.isArray(m.hunks)) return null;
    return m;
  }

  static _readMeta(m) {
    if (typeof m.path !== 'string' || !m.path) return null;
    const ok = (v) => v == null || (Number.isInteger(v) && v > 0);
    if (!ok(m.offset) || !ok(m.lines) || !ok(m.totalLines)) return null;
    return m;
  }

  static _diffText(m) {
    if (m.noBasis) return m.path + (m.created ? ' · created' : '');
    const counts = [];
    if (m.added) counts.push('+' + m.added);
    if (m.removed) counts.push('-' + m.removed);
    const what = m.created ? 'created' : (counts.join(' ') || 'no change');
    return m.path + ' · ' + what + (m.truncated ? ' · shortened' : '');
  }

  static _readText(m) {
    const bits = [m.path];
    if (m.offset && m.lines) {
      bits.push('lines ' + m.offset + '-' + (m.offset + m.lines - 1) + (m.totalLines ? ' of ' + m.totalLines : ''));
    } else if (m.totalLines) {
      bits.push(m.totalLines + ' lines');
    }
    return bits.join(' · ');
  }
}
