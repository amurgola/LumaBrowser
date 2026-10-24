class LumabyteActions {
  static MAX_ACTIONS = 5;
  static SETTLE_MS = 700;
  static TYPES = ['click', 'type', 'key', 'scroll', 'read'];
  static DESKTOP_TYPES = ['click', 'type', 'key', 'scroll'];
  static TEXT_PREVIEW = 40;

  constructor({ getDesktop, files = null, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this._getDesktop = getDesktop;
    this._files = files;
    this._sleep = sleep;
  }

  unavailableReason() {
    const d = this._getDesktop();
    if (!d) return 'Desktop control is not running';
    try { return typeof d.gate === 'function' ? d.gate() : null; } catch (err) { return (err && err.message) || 'Desktop control failed'; }
  }

  canRead() {
    return !!this._files;
  }

  async folderOf(hwnd, app) {
    if (!this._files) return null;
    try { return await this._files.folderOf(hwnd, app || {}); } catch (_) { return null; }
  }

  async observe(hwnd) {
    const d = this._getDesktop();
    if (!d || this.unavailableReason()) return null;
    const r = await d.observe({ hwnd });
    return r && r.success && r.data ? String(r.data.text || '') : null;
  }

  async run(hwnd, actions, onStep = () => {}, { folder = null } = {}) {
    const d = this._getDesktop();
    const results = [];
    for (const [index, action] of actions.slice(0, LumabyteActions.MAX_ACTIONS).entries()) {
      const text = LumabyteActions.describe(action);
      onStep({ index, text, state: 'run' });
      let r;
      try {
        r = action.type === 'read' ? await this._read(action, folder) : await this._one(d, hwnd, action);
      } catch (err) {
        r = { success: false, error: (err && err.message) || String(err) };
      }
      const ok = !!(r && r.success);
      results.push({ action, ok, text, ...(ok && r.output ? { output: r.output } : {}), ...(ok ? {} : { error: (r && r.error) || 'failed' }) });
      onStep({ index, text, state: ok ? 'done' : 'fail', error: ok ? undefined : (r && r.error) });
      if (!ok) break;
      if (action.type !== 'read') await this._sleep(LumabyteActions.SETTLE_MS);
    }
    return results;
  }

  async _read(a, folder) {
    if (!this._files) return { success: false, error: 'Reading files is off' };
    const r = await this._files.read(a.path, { folder });
    return r.ok ? { success: true, output: r.text } : { success: false, error: r.error };
  }

  _one(d, hwnd, a) {
    if (!d) return Promise.resolve({ success: false, error: 'Desktop control is not running' });
    const base = { hwnd };
    switch (a.type) {
      case 'click': return d.click({ ...base, ...LumabyteActions._pick(a, ['ref', 'description', 'double', 'button']) });
      case 'type': return d.type({ ...base, ...LumabyteActions._pick(a, ['text', 'ref', 'submit']) });
      case 'key': return d.pressKey({ ...base, keys: String(a.keys || '') });
      case 'scroll': return d.scroll({ ...base, ...LumabyteActions._pick(a, ['direction', 'amount', 'description']) });
      default: return Promise.resolve({ success: false, error: `Unknown action "${a.type}"` });
    }
  }

  static parse(text, { types = LumabyteActions.TYPES } = {}) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const fence = raw.match(/```(?:actions|json)?\s*\n?([\s\S]*?)```/i);
    const body = fence ? fence[1] : (raw.startsWith('{') ? raw : null);
    if (!body) return null;
    let data;
    try { data = JSON.parse(body.trim()); } catch (_) { return null; }
    if (!data || !Array.isArray(data.actions)) return null;
    const actions = data.actions.map(LumabyteActions._normalize).filter((a) => a && types.includes(a.type));
    if (!actions.length) return null;
    return { actions, say: typeof (data.say || data.reason) === 'string' ? String(data.say || data.reason) : '' };
  }

  static _normalize(a) {
    if (!a || typeof a !== 'object') return null;
    let type = String(a.type || a.action || '').toLowerCase().replace(/[\s-]+/g, '_');
    const out = {};
    if (type === 'double_click' || type === 'doubleclick') { type = 'click'; out.double = true; }
    if (type === 'right_click') { type = 'click'; out.button = 'right'; }
    if (type === 'press' || type === 'press_key' || type === 'hotkey') type = 'key';
    if (['read_file', 'read_folder', 'list', 'list_folder', 'list_files', 'cat'].includes(type)) type = 'read';
    if (!LumabyteActions.TYPES.includes(type)) return null;
    out.type = type;
    const t = a.target && typeof a.target === 'object' ? a.target : {};
    if (type === 'read') {
      const p = [a.path, a.file, a.folder, a.name, t.path, t.name].find((v) => typeof v === 'string' && v.trim());
      return p ? { type, path: p.trim() } : null;
    }
    const ref = Number(a.ref != null ? a.ref : t.ref);
    if (Number.isFinite(ref) && ref > 0) out.ref = ref;
    const desc = a.description || t.description || (t.name ? `the "${t.name}" ${String(t.role || 'item').toLowerCase()}` : '');
    if (desc && out.ref == null) out.description = String(desc);
    if (a.double === true) out.double = true;
    if (a.button === 'right' || a.button === 'middle') out.button = a.button;
    if (type === 'type') { out.text = String(a.text || ''); if (a.submit === true) out.submit = true; if (!out.text) return null; }
    if (type === 'key') { out.keys = String(a.keys || a.key || ''); if (!out.keys) return null; }
    if (type === 'scroll') { out.direction = ['up', 'down', 'left', 'right'].includes(a.direction) ? a.direction : 'down'; if (Number(a.amount) > 0) out.amount = Math.min(10, Number(a.amount)); }
    if (type === 'click' && out.ref == null && !out.description) return null;
    return out;
  }

  static describe(a) {
    const what = a.ref != null ? `[${a.ref}]` : (a.description || '');
    switch (a.type) {
      case 'click': return `${a.double ? 'Double-click' : a.button === 'right' ? 'Right-click' : 'Click'} ${what}`.trim();
      case 'type': {
        const t = a.text.length > LumabyteActions.TEXT_PREVIEW ? `${a.text.slice(0, LumabyteActions.TEXT_PREVIEW - 3)}...` : a.text;
        return `Type "${t}"${a.submit ? ' and Enter' : ''}`;
      }
      case 'key': return `Press ${a.keys}`;
      case 'read': return `Read ${String(a.path).split(/[\\/]/).filter(Boolean).pop() || a.path}`;
      default: return `Scroll ${a.direction}${a.description ? ` over ${a.description}` : ''}`;
    }
  }

  static report(results) {
    return results.map((r) => `${r.ok ? 'Done' : 'Failed'}: ${r.text}${r.ok ? '' : ` (${r.error})`}`).join('\n');
  }

  static outputs(results) {
    return results.filter((r) => r.ok && r.output).map((r) => r.output).join('\n\n');
  }

  static _pick(a, keys) {
    const out = {};
    for (const k of keys) if (a[k] !== undefined) out[k] = a[k];
    return out;
  }
}

module.exports = LumabyteActions;
