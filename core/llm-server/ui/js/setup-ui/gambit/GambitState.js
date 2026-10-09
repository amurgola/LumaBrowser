export default class GambitState {
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
      st = { phase: null, done: 0, total: 0, taskId: null, group: null, report: null, error: null, ranAt: null, hasRaw: false };
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
    Object.assign(this.ensure(path), { phase: 'running', error: null, done: 0, total: 0, taskId: null, group: null });
  }

  fail(path, message) {
    const st = this.ensure(path);
    st.phase = 'error';
    st.error = message;
    this.busy = false;
  }

  reconcile(path, res) {
    if (res && !res.success) { this.fail(path, res.error || 'The gambit could not start.'); return; }
    if (!(res && res.success && this.routePath === path)) return;
    const st = this.ensure(path);
    GambitState._copyReport(st, res);
    if (st.phase === 'running') st.phase = res.canceled ? 'canceled' : 'done';
    this.busy = false;
  }

  applyEvent(type, payload) {
    if (type === 'resolved') return this._resolved(payload);
    if (!this.routePath) return false;
    const st = this.ensure(this.routePath);
    if (type === 'server') st.taskId = payload && payload.state === 'starting' ? 'starting the chat server' : null;
    else if (type === 'progress') GambitState._progress(st, payload || {});
    else if (type === 'done' || type === 'canceled') this._finished(st, type, payload);
    else if (type === 'error') this.fail(this.routePath, (payload && payload.message) || 'The gambit failed.');
    return true;
  }

  adoptLive(live) {
    this.routePath = live.modelPath;
    this.busy = true;
    Object.assign(this.ensure(live.modelPath), {
      phase: 'running', total: live.total || 0, done: live.done || 0, taskId: live.taskId || null, group: live.group || null, error: null,
    });
  }

  adoptStored(results) {
    for (const path of Object.keys(results)) {
      const entry = results[path];
      if (this.isRunning(path) || !entry || !entry.report) continue;
      const st = this.ensure(path);
      if (st.phase === 'running') continue;
      Object.assign(st, { phase: entry.canceled ? 'canceled' : 'done', report: entry.report, ranAt: entry.ranAt || null, hasRaw: false, error: null });
    }
  }

  rawUnavailable(path, message) {
    const st = this.ensure(path);
    st.error = message;
    st.hasRaw = false;
  }

  _resolved(payload) {
    const p = (payload && payload.modelPath) || this.routePath;
    if (!p) return false;
    this.routePath = p;
    const st = this.ensure(p);
    st.phase = 'running';
    if (payload && typeof payload.total === 'number') st.total = payload.total;
    return true;
  }

  _finished(st, type, payload) {
    GambitState._copyReport(st, payload);
    st.phase = type;
    this.busy = false;
  }

  static _progress(st, m) {
    if (typeof m.total === 'number') st.total = m.total;
    if (typeof m.done === 'number') st.done = m.done;
    if (m.taskId) st.taskId = m.taskId;
    if (m.group) st.group = m.group;
  }

  static _copyReport(st, src) {
    if (!src) return;
    if (src.report) { st.report = src.report; st.hasRaw = true; }
    if (src.ranAt) st.ranAt = src.ranAt;
  }
}
