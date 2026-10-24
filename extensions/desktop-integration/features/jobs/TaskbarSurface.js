const TaskbarIcons = require('./TaskbarIcons');

class TaskbarSurface {
  static RENDER_DELAY_MS = 150;

  constructor({
    registry, getWindow, options, nativeImage = null, platform = process.platform, now = () => Date.now(),
    setTimeout: st = setTimeout, clearTimeout: ct = clearTimeout,
  }) {
    this._registry = registry;
    this._getWindow = getWindow;
    this._options = options;
    this._icons = new TaskbarIcons(nativeImage);
    this._win32 = platform === 'win32';
    this._now = now;
    this._st = st;
    this._ct = ct;
    this._off = null;
    this._timer = null;
    this._errorTimer = null;
    this._errorUntil = 0;
    this._win = null;
    this._shown = { progress: null, overlay: null, thumbar: null };
  }

  start() {
    if (this._off) return;
    this._off = this._registry.onChange((event) => this._onChange(event));
    this.render();
  }

  schedule() {
    if (this._timer) return;
    this._timer = this._st(() => { this._timer = null; this.render(); }, TaskbarSurface.RENDER_DELAY_MS);
  }

  render() {
    const win = this._window();
    if (win !== this._win) {
      this._clear(this._win);
      this._win = win;
      this._shown = { progress: null, overlay: null, thumbar: null };
    }
    if (!win) return;
    const opts = this._opts();
    const agg = this._registry.aggregate(opts.includeChat ? null : (j) => j.kind !== 'chat');
    const failing = this._errorUntil > this._now();
    this._renderProgress(win, opts.progress ? TaskbarSurface.progressState(agg, failing) : 'none');
    this._renderOverlay(win, opts.overlay && this._win32 ? TaskbarSurface.overlayState(agg, failing) : 'none', agg);
    this._renderThumbar(win, opts.thumbar && this._win32 ? this._buttonsFor(this._registry.aggregate().jobs) : []);
  }

  dispose() {
    if (this._off) { try { this._off(); } catch (_) {} }
    this._off = null;
    if (this._timer) this._ct(this._timer);
    if (this._errorTimer) this._ct(this._errorTimer);
    this._timer = null;
    this._errorTimer = null;
    this._clear(this._win);
    this._win = null;
  }

  static progressState(agg, failing) {
    if (failing) return 'error';
    if (!agg.running && !agg.queued) return 'none';
    if (agg.progress === null) return 'indeterminate';
    return Math.round(agg.progress * 100) / 100;
  }

  static overlayState(agg, failing) {
    if (failing) return 'failed';
    return agg.running || agg.queued ? 'running' : 'none';
  }

  _onChange(event) {
    const job = event && event.job;
    if (job && job.state === 'failed' && (this._opts().includeChat || job.kind !== 'chat')) {
      const ms = Math.max(0, Number(this._opts().errorSeconds) || 0) * 1000;
      if (ms > 0) {
        this._errorUntil = this._now() + ms;
        if (this._errorTimer) this._ct(this._errorTimer);
        this._errorTimer = this._st(() => { this._errorTimer = null; this.render(); }, ms + 20);
      }
    }
    this.schedule();
  }

  _renderProgress(win, state) {
    if (state === this._shown.progress) return;
    this._shown.progress = state;
    TaskbarSurface._call(win, 'setProgressBar', ...TaskbarSurface._progressArgs(state));
  }

  static _progressArgs(state) {
    if (state === 'none') return [-1, { mode: 'none' }];
    if (state === 'error') return [1, { mode: 'error' }];
    if (state === 'indeterminate') return [2, { mode: 'indeterminate' }];
    return [Math.max(0.01, state), { mode: 'normal' }];
  }

  _renderOverlay(win, state, agg) {
    const count = agg.running + agg.queued;
    const key = `${state}:${count}`;
    if (key === this._shown.overlay) return;
    const wasShown = this._shown.overlay !== null && !this._shown.overlay.startsWith('none');
    this._shown.overlay = key;
    if (state === 'none') { if (wasShown) TaskbarSurface._call(win, 'setOverlayIcon', null, ''); return; }
    const icon = this._icons.get(state);
    const text = state === 'failed' ? 'A LumaBrowser job failed' : `${count} LumaBrowser job${count === 1 ? '' : 's'} running`;
    if (icon) TaskbarSurface._call(win, 'setOverlayIcon', icon, text);
  }

  _buttonsFor(jobs) {
    const buttons = [];
    const chat = jobs.find((j) => j.kind === 'chat' && j.cancellable && j.state === 'running');
    if (chat) buttons.push({ jobId: chat.id, tooltip: 'Stop generation', icon: 'stop' });
    const other = jobs.filter((j) => j.kind !== 'chat' && j.cancellable).sort((a, b) => b.startedAt - a.startedAt)[0];
    if (other) buttons.push({ jobId: other.id, tooltip: `Cancel: ${other.title}`.slice(0, 120), icon: 'cancel' });
    return buttons;
  }

  _renderThumbar(win, buttons) {
    const key = JSON.stringify(buttons);
    if (key === this._shown.thumbar) return;
    if (!buttons.length && this._shown.thumbar === null) { this._shown.thumbar = key; return; }
    this._shown.thumbar = key;
    const native = buttons.map((b) => ({
      tooltip: b.tooltip,
      icon: this._icons.get(b.icon),
      click: () => { this._registry.cancel(b.jobId).catch(() => {}); },
    })).filter((b) => b.icon);
    TaskbarSurface._call(win, 'setThumbarButtons', native);
  }

  _clear(win) {
    if (!win || TaskbarSurface._dead(win)) return;
    if (this._shown.progress !== null && this._shown.progress !== 'none') TaskbarSurface._call(win, 'setProgressBar', -1, { mode: 'none' });
    if (this._shown.overlay !== null && !String(this._shown.overlay).startsWith('none')) TaskbarSurface._call(win, 'setOverlayIcon', null, '');
    if (this._shown.thumbar !== null && this._shown.thumbar !== '[]') TaskbarSurface._call(win, 'setThumbarButtons', []);
    this._shown = { progress: null, overlay: null, thumbar: null };
  }

  _window() {
    let win = null;
    try { win = this._getWindow() || null; } catch (_) { win = null; }
    return win && !TaskbarSurface._dead(win) ? win : null;
  }

  _opts() {
    try { return this._options() || {}; } catch (_) { return {}; }
  }

  static _dead(win) {
    try { return typeof win.isDestroyed === 'function' && win.isDestroyed(); } catch (_) { return true; }
  }

  static _call(win, method, ...args) {
    try {
      if (typeof win[method] === 'function') win[method](...args);
    } catch (_) {}
  }
}

module.exports = TaskbarSurface;
