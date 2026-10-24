class RegionOverlay {
  static TIMEOUT_MS = 120000;
  static MIN_SIZE = 4;

  constructor({ BrowserWindow, timeoutMs = RegionOverlay.TIMEOUT_MS }) {
    this._BrowserWindow = BrowserWindow;
    this._timeoutMs = timeoutMs;
    this._active = null;
  }

  get active() {
    return !!this._active;
  }

  async pick(displays) {
    if (this._active || !displays || !displays.length) return null;
    const session = { windows: [], done: false, timer: null };
    this._active = session;
    try {
      return await new Promise((resolve) => {
        const finish = (value) => {
          if (session.done) return;
          session.done = true;
          resolve(value);
        };
        session.finish = finish;
        session.timer = setTimeout(() => finish(null), this._timeoutMs);
        displays.forEach((display, i) => this._open(session, display, i === 0, finish));
      });
    } finally {
      clearTimeout(session.timer);
      this._closeAll(session);
      if (this._active === session) this._active = null;
    }
  }

  cancel() {
    const session = this._active;
    if (session && session.finish) session.finish(null);
  }

  _open(session, display, focus, finish) {
    const b = display.bounds;
    let win;
    try {
      win = new this._BrowserWindow({
        x: b.x, y: b.y, width: b.width, height: b.height,
        show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
        resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
        skipTaskbar: true, alwaysOnTop: true, enableLargerThanScreen: true, focusable: true,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
      });
    } catch (_) {
      return;
    }
    session.windows.push(win);
    try { win.setAlwaysOnTop(true, 'screen-saver'); } catch (_) {}
    try { win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height }); } catch (_) {}
    win.once('ready-to-show', () => {
      if (session.done) return;
      win.show();
      if (focus) win.focus();
    });
    win.on('closed', () => finish(null));
    Promise.resolve(win.loadURL(RegionOverlay.pageUrl()))
      .then(() => win.webContents.executeJavaScript('window.__lumaPick', true))
      .then((rect) => finish(RegionOverlay._valid(rect) ? { displayId: display.id, rect: RegionOverlay._rounded(rect) } : null))
      .catch(() => { if (!session.done) finish(null); });
  }

  _closeAll(session) {
    for (const win of session.windows) {
      try { if (!win.isDestroyed || !win.isDestroyed()) win.destroy(); } catch (_) {}
    }
    session.windows = [];
  }

  static _valid(rect) {
    return !!rect && Number.isFinite(rect.x) && Number.isFinite(rect.y)
      && rect.width >= RegionOverlay.MIN_SIZE && rect.height >= RegionOverlay.MIN_SIZE;
  }

  static _rounded(r) {
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  }

  static pageUrl() {
    return `data:text/html;charset=utf-8,${encodeURIComponent(RegionOverlay.pageHtml())}`;
  }

  static pageHtml() {
    return [
      '<!doctype html><html><head><meta charset="utf-8"><title>Luma region</title><style>',
      'html,body{margin:0;height:100%;overflow:hidden;cursor:crosshair;user-select:none;background:rgba(0,0,0,0.28);font:13px system-ui,sans-serif}',
      'body.dragging{background:transparent}',
      '#sel{position:fixed;display:none;border:1px solid #fff;outline:1px solid rgba(0,0,0,0.6);background:rgba(255,255,255,0.03);box-shadow:0 0 0 100000px rgba(0,0,0,0.28)}',
      '#hint{position:fixed;left:50%;top:24px;transform:translateX(-50%);padding:6px 12px;border-radius:6px;background:rgba(20,20,20,0.85);color:#eee;pointer-events:none}',
      '</style></head><body><div id="sel"></div><div id="hint">Drag to capture a region. Esc cancels.</div><script>',
      '(function(){var done,start=null,sel=document.getElementById("sel");',
      'window.__lumaPick=new Promise(function(r){done=r;});',
      'function box(e){var x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY);return {x:x,y:y,width:Math.abs(e.clientX-start.x),height:Math.abs(e.clientY-start.y)};}',
      'function draw(b){sel.style.left=b.x+"px";sel.style.top=b.y+"px";sel.style.width=b.width+"px";sel.style.height=b.height+"px";}',
      'document.addEventListener("keydown",function(e){if(e.key==="Escape")done(null);});',
      'document.addEventListener("contextmenu",function(e){e.preventDefault();done(null);});',
      'document.addEventListener("pointerdown",function(e){if(e.button!==0)return;start={x:e.clientX,y:e.clientY};',
      'try{document.body.setPointerCapture(e.pointerId);}catch(_){}',
      'document.body.classList.add("dragging");document.getElementById("hint").style.display="none";sel.style.display="block";draw(box(e));});',
      'document.addEventListener("pointermove",function(e){if(start)draw(box(e));});',
      'document.addEventListener("pointerup",function(e){if(!start)return;var b=box(e);start=null;',
      'if(b.width<4||b.height<4){sel.style.display="none";document.body.classList.remove("dragging");return;}done(b);});',
      '})();</script></body></html>',
    ].join('');
  }
}

module.exports = RegionOverlay;
