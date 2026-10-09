export default class FitTestState {
  constructor() {
    this._byPath = new Map();
    this.routePath = null;
    this.busy = false;
  }

  get(path) {
    return this._byPath.get(path) || null;
  }

  ensure(path) {
    let st = this._byPath.get(path);
    if (!st) {
      st = { phase: null, runtime: null, total: 0, index: 0, combo: null, results: [], error: null, chatServer: null, hardware: null, ranAt: null };
      this._byPath.set(path, st);
    }
    return st;
  }

  isRunning(path) {
    return this.busy && this.routePath === path;
  }

  begin(path) {
    this.routePath = path;
    this.busy = true;
    Object.assign(this.ensure(path), {
      phase: 'running', results: [], error: null, chatServer: null, combo: null, index: 0, total: 0, runtime: null, hardware: null, ranAt: null,
    });
  }

  fail(path, message) {
    const st = this.ensure(path);
    st.phase = 'error';
    st.error = message;
    this.busy = false;
  }

  reconcile(path, res) {
    if (res && !res.success) { this.fail(path, res.error || 'Fit test could not start.'); return true; }
    if (!(res && res.success && this.routePath === path)) return false;
    const st = this.ensure(path);
    if (Array.isArray(res.results)) st.results = res.results;
    FitTestState._copyRunInfo(st, res);
    if (st.phase === 'running') st.phase = res.canceled ? 'canceled' : 'done';
    this.busy = false;
    return true;
  }

  applyEvent(type, payload) {
    if (type === 'resolved') return this._resolved(payload);
    if (!this.routePath) return false;
    const st = this.ensure(this.routePath);
    if (type === 'progress') FitTestState._progress(st, payload || {});
    else if (type === 'chat-server') st.chatServer = payload || null;
    else if (type === 'done' || type === 'canceled') this._finished(st, type, payload);
    else if (type === 'error') this.fail(this.routePath, (payload && payload.message) || 'Fit test failed.');
    return true;
  }

  adoptLive(live) {
    this.routePath = live.modelPath;
    this.busy = true;
    Object.assign(this.ensure(live.modelPath), {
      phase: 'running',
      runtime: live.runtime || null,
      hardware: live.hardware || null,
      total: live.total || 0,
      index: live.index || 0,
      combo: live.combo || null,
      results: Array.isArray(live.results) ? live.results.slice() : [],
      chatServer: live.chatServer || null,
      error: null,
    });
  }

  adoptStored(results) {
    for (const path of Object.keys(results)) {
      const entry = results[path];
      if (this.isRunning(path)) continue;
      if (!entry || !Array.isArray(entry.results) || !entry.results.length) continue;
      const st = this.ensure(path);
      if (st.phase === 'running') continue;
      Object.assign(st, {
        phase: entry.canceled ? 'canceled' : 'done',
        runtime: entry.runtime || null,
        results: entry.results,
        hardware: entry.hardware || null,
        ranAt: entry.ranAt || null,
        error: null,
      });
    }
  }

  _resolved(payload) {
    const p = (payload && payload.model && payload.model.path) || this.routePath;
    if (!p) return false;
    this.routePath = p;
    const st = this.ensure(p);
    st.runtime = (payload && payload.runtime) || null;
    if (payload && payload.hardware) st.hardware = payload.hardware;
    st.phase = 'running';
    return true;
  }

  _finished(st, type, payload) {
    if (payload && Array.isArray(payload.results)) st.results = payload.results;
    FitTestState._copyRunInfo(st, payload);
    st.phase = type;
    this.busy = false;
  }

  static _progress(st, m) {
    if (typeof m.total === 'number') st.total = m.total;
    if (typeof m.index === 'number') st.index = m.index;
    if (m.combo) st.combo = m.combo;
    if (m.phase === 'combo-done' && m.result) {
      st.results = (st.results || []).filter((r) => !(r.contextTokens === m.result.contextTokens && r.kv === m.result.kv));
      st.results.push(m.result);
    }
  }

  static _copyRunInfo(st, src) {
    if (!src) return;
    if (src.runtime) st.runtime = src.runtime;
    if (src.hardware) st.hardware = src.hardware;
    if (src.ranAt) st.ranAt = src.ranAt;
  }
}
