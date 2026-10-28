const fs = require('fs');
const path = require('path');
const ActivityPages = require('./ActivityPages');

class ActivityOverlay {
  static ISLAND_TOP_GAP = 6;
  static ISLAND_CAPTION = 'Luma island';
  static RING_CAPTION = 'Luma ring';
  static EXIT_MS = 340;
  static TOKENS = path.join(__dirname, '..', '..', '..', 'core', 'llm-server', 'ui', 'css', 'tokens.css');

  constructor({ electron = null, displayFor = null, frameFor = null, placement = null, log = null, tokensCss = null } = {}) {
    this._electron = electron;
    this._placement = placement;
    this._displayFor = displayFor || (() => null);
    this._frameFor = frameFor || (() => null);
    this._ringBounds = null;
    this._lock = 0;
    this._log = log || { warn: () => {} };
    this._tokensCss = tokensCss;
    this._ring = null;
    this._island = null;
    this._session = null;
    this._peek = null;
    this._counter = 0;
    this._shown = null;
    this._hideTimer = null;
    this._disposed = false;
  }

  get active() {
    return this._session ? this._session.id : null;
  }

  get peeking() {
    return !!this._peek;
  }

  show(state, onAction = () => {}) {
    if (this._session) this._end(this._session);
    const session = { id: `act-${++this._counter}`, state: { ring: true, island: true, ...state }, onAction, closed: false, timer: null };
    session.display = this._pickDisplay(state.frame || state.hwnd);
    this._aim(session);
    this._session = session;
    if (!this._peek) this._render(session, true);
    return {
      id: session.id,
      update: (patch) => this.update(session, patch),
      close: (opts) => this.close(session, opts),
    };
  }

  update(session, patch) {
    if (session.closed || this._session !== session) return false;
    session.state = { ...session.state, ...patch };
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'frame')) this._aim(session);
    if (!this._peek) this._render(session, false);
    return true;
  }

  _aim(session) {
    const hwnd = session.state.frame;
    session.frame = hwnd ? this._pickFrame(hwnd) : null;
    if (session.frame) session.display = this._displayMatching(session.frame) || session.display;
  }

  close(session, { after = 0 } = {}) {
    if (session.closed || this._session !== session) return false;
    clearTimeout(session.timer);
    if (after > 0) {
      session.timer = setTimeout(() => this.close(session), after);
      return true;
    }
    this._end(session);
    if (!this._peek) this._retract();
    return true;
  }

  peek(state, onAction = () => {}) {
    const base = this._session ? this._session.display : null;
    const replacing = !!this._peek;
    const peek = { state: { ring: true, island: true, ...state }, onAction };
    const anchor = state.frame || state.hwnd;
    peek.display = anchor ? this._pickDisplay(anchor) : (base || this._pickDisplay(0));
    peek.frame = state.frame ? this._pickFrame(state.frame) : null;
    if (peek.frame) peek.display = this._displayMatching(peek.frame) || peek.display;
    const was = replacing ? this._peek.frame : null;
    if (!replacing || JSON.stringify(was) !== JSON.stringify(peek.frame)) this._lock += 1;
    peek.lock = this._lock;
    this._peek = peek;
    this._render(peek, !replacing);
    return true;
  }

  conceal() {
    clearTimeout(this._hideTimer);
    this._shown = null;
    for (const w of [this._ring, this._island]) { if (w && !w.isDestroyed()) { try { w.hide(); } catch (_) {} } }
    this._ringBounds = null;
    return () => {
      const target = this._peek || this._session;
      if (target && !this._disposed) this._render(target, true);
    };
  }

  unpeek() {
    if (!this._peek) return false;
    this._peek = null;
    if (this._session) this._render(this._session, true);
    else this._retract();
    return true;
  }

  dispose() {
    this._disposed = true;
    this._peek = null;
    if (this._session) this._end(this._session);
    clearTimeout(this._hideTimer);
    for (const w of [this._ring, this._island]) { if (w && !w.isDestroyed()) { try { w.destroy(); } catch (_) {} } }
    this._ring = null;
    this._island = null;
  }

  _end(session) {
    session.closed = true;
    clearTimeout(session.timer);
    if (this._session === session) this._session = null;
  }

  _retract() {
    this._shown = null;
    this._exec(this._island, 'window.__island && window.__island.render({visible:false})');
    this._exec(this._ring, 'window.__ring && window.__ring.render({on:false})');
    this._ringBounds = null;
    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      if (this._session || this._peek) return;
      for (const w of [this._ring, this._island]) { if (w && !w.isDestroyed()) { try { w.hide(); } catch (_) {} } }
    }, ActivityOverlay.EXIT_MS);
  }

  _render(target, first) {
    this._shown = target;
    clearTimeout(this._hideTimer);
    this._chain = (this._chain || Promise.resolve())
      .then(() => this._paint(target, first))
      .catch((err) => this._log.warn(`activity overlay failed: ${(err && err.message) || err}`));
    return this._chain;
  }

  async _paint(target, first) {
    if (this._disposed || this._shown !== target) return;
    const s = target.state;
    const display = target.display;
    if (!display) return;
    const frame = target.frame || null;
    if (s.ring !== false) {
      const ring = await this._ensure('ring');
      if (this._shown !== target) return;
      const bounds = frame ? ActivityOverlay._clampTo(ActivityOverlay._padded(frame), display.bounds) : display.bounds;
      const inset = frame ? ActivityOverlay._insetOf(frame, bounds) : null;
      if (first || JSON.stringify(bounds) !== JSON.stringify(this._ringBounds)) {
        this._place(ring, bounds);
        this._ringBounds = bounds;
        this._placeOnWayland(ActivityOverlay.RING_CAPTION, bounds);
      }
      await this._exec(ring, `window.__ring.render(${JSON.stringify({ on: true, mode: ActivityOverlay._ringMode(s), framed: !!frame, inset, lock: target.lock || 0 })})`);
      if (!ring.isVisible()) ring.showInactive();
    } else if (this._ring) {
      await this._exec(this._ring, 'window.__ring.render({on:false})');
    }
    if (s.island !== false) {
      const island = await this._ensure('island');
      if (this._shown !== target) return;
      const size = await this._exec(island, `window.__island.render(${JSON.stringify(ActivityOverlay._islandState(s, !first))})`);
      if (this._shown !== target || !size) return;
      const bounds = ActivityOverlay._islandBounds(display.workArea || display.bounds, frame, size);
      this._place(island, bounds);
      if (!island.isVisible()) island.showInactive();
      this._placeOnWayland(ActivityOverlay.ISLAND_CAPTION, bounds);
      if (first) await this._exec(island, `window.__island.render(${JSON.stringify(ActivityOverlay._islandState(s, true))})`);
    } else if (this._island) {
      await this._exec(this._island, 'window.__island.render({visible:false})');
    }
  }

  _listen(island) {
    const loop = () => {
      if (island.isDestroyed()) return;
      island.webContents.executeJavaScript('window.__island.next()', true).then((id) => {
        const target = this._peek || this._session;
        if (id && target) {
          try { target.onAction(id); } catch (err) { this._log.warn(`activity action ${id} failed: ${(err && err.message) || err}`); }
        }
        loop();
      }, () => {});
    };
    loop();
  }

  async _ensure(which) {
    const existing = which === 'ring' ? this._ring : this._island;
    if (existing && !existing.isDestroyed()) return existing;
    const { BrowserWindow } = this._electron || require('electron');
    const win = new BrowserWindow({
      show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
      resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
      skipTaskbar: true, focusable: false, alwaysOnTop: true, enableLargerThanScreen: which === 'ring',
      width: which === 'ring' ? 800 : 420, height: which === 'ring' ? 600 : 80,
      title: which === 'ring' ? ActivityOverlay.RING_CAPTION : ActivityOverlay.ISLAND_CAPTION,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    });
    try { win.setAlwaysOnTop(true, 'screen-saver'); } catch (_) {}
    if (which === 'ring') { try { win.setIgnoreMouseEvents(true); } catch (_) {} }
    const css = this._css();
    await win.loadURL(ActivityPages.dataUrl(which === 'ring' ? ActivityPages.ringHtml(css) : ActivityPages.islandHtml(css)));
    win.on('closed', () => {
      if (this._ring === win) this._ring = null;
      if (this._island === win) this._island = null;
    });
    if (which === 'ring') this._ring = win;
    else {
      this._island = win;
      this._listen(win);
    }
    return win;
  }

  _place(win, bounds) {
    try { win.setBounds(bounds); } catch (_) {}
  }

  _placeOnWayland(caption, bounds) {
    if (!this._placement) return;
    const result = this._placement.move({ caption, x: bounds.x, y: bounds.y });
    if (result && typeof result.catch === 'function') result.catch((err) => this._log.warn(`${caption} placement failed: ${(err && err.message) || err}`));
  }

  async _exec(win, code) {
    if (!win || win.isDestroyed()) return null;
    try { return await win.webContents.executeJavaScript(code, true); } catch (_) { return null; }
  }

  frameOf(hwnd) {
    return hwnd ? this._pickFrame(hwnd) : null;
  }

  _pickFrame(hwnd) {
    try {
      const r = this._frameFor(hwnd);
      return r && r.width > 0 && r.height > 0 ? { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } : null;
    } catch (_) {
      return null;
    }
  }

  _displayMatching(rect) {
    try {
      const { screen } = this._electron || require('electron');
      return typeof screen.getDisplayMatching === 'function' ? screen.getDisplayMatching(rect) : null;
    } catch (_) {
      return null;
    }
  }

  _pickDisplay(hwnd) {
    let display = null;
    try { display = hwnd ? this._displayFor(hwnd) : null; } catch (_) { display = null; }
    if (display) return display;
    try {
      const { screen } = this._electron || require('electron');
      return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    } catch (_) {
      return null;
    }
  }

  _css() {
    if (this._tokensCss === null) {
      try { this._tokensCss = fs.readFileSync(ActivityOverlay.TOKENS, 'utf8'); } catch (_) { this._tokensCss = ''; }
    }
    return this._tokensCss;
  }

  static _clampTo(r, d) {
    const x = Math.max(r.x, d.x);
    const y = Math.max(r.y, d.y);
    const right = Math.min(r.x + r.width, d.x + d.width);
    const bottom = Math.min(r.y + r.height, d.y + d.height);
    return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
  }

  static _insetOf(frame, bounds) {
    return [
      Math.max(0, frame.y - bounds.y),
      Math.max(0, (bounds.x + bounds.width) - (frame.x + frame.width)),
      Math.max(0, (bounds.y + bounds.height) - (frame.y + frame.height)),
      Math.max(0, frame.x - bounds.x),
    ];
  }

  static _padded(r) {
    const p = ActivityPages.RING_PAD;
    return { x: r.x - p, y: r.y - p, width: r.width + 2 * p, height: r.height + 2 * p };
  }

  static _islandBounds(area, frame, size) {
    const box = frame || area;
    let x = Math.round(box.x + (box.width - size.width) / 2);
    let y = box.y + ActivityOverlay.ISLAND_TOP_GAP;
    if (frame) {
      x = Math.max(area.x, Math.min(x, area.x + area.width - size.width));
      y = Math.max(area.y + ActivityOverlay.ISLAND_TOP_GAP, Math.min(y, area.y + area.height - size.height));
    }
    return { x, y, width: size.width, height: size.height };
  }

  static _ringMode(s) {
    if (s.kind === 'keys') return 'armed';
    if (s.paused) return 'paused';
    if (s.kind === 'busy') return 'busy';
    if (s.kind === 'speech') return 'live';
    return '';
  }

  static _islandState(s, visible) {
    return {
      visible,
      kind: s.kind || 'busy',
      title: s.title || '',
      detail: s.detail || '',
      hint: s.hint || '',
      caption: s.caption || '',
      actions: Array.isArray(s.actions) ? s.actions : [],
      keys: Array.isArray(s.keys) ? s.keys : [],
      progress: typeof s.progress === 'number' ? s.progress : null,
      paused: !!s.paused,
    };
  }
}

module.exports = ActivityOverlay;
