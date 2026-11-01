(function () {
  const api = window.windowTab;
  const params = new URLSearchParams(location.search);
  const hwnd = Number(params.get('hwnd')) || 0;
  const el = (id) => document.getElementById(id);
  const els = {
    icon: el('icon'), appIcon: el('app-icon'), title: el('title'), meta: el('meta'), status: el('status'),
    control: el('control'), textToggle: el('text-toggle'), restore: el('restore'), pick: el('pick'),
    stage: el('stage'), video: el('video'), overlay: el('overlay'), overlayTitle: el('overlay-title'), overlayText: el('overlay-text'),
    overlayRestore: el('overlay-restore'), overlayRetry: el('overlay-retry'), overlayPick: el('overlay-pick'), hint: el('hint'),
    textPanel: el('text-panel'), textNote: el('text-note'), text: el('text'), picker: el('picker'), windows: el('windows'), pickerClose: el('picker-close'), toast: el('toast'),
  };
  const KEY_NAMES = {
    ' ': 'space', Enter: 'enter', Backspace: 'backspace', Tab: 'tab', Escape: 'escape', Delete: 'delete', Insert: 'insert',
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'home', End: 'end', PageUp: 'pageup', PageDown: 'pagedown',
  };
  const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock']);
  const HIDDEN_TEXT_MS = 45000;
  const STATE_VISIBLE_MS = 1000;
  const STATE_HIDDEN_MS = 5000;

  let state = null;
  let stream = null;
  let control = false;
  let starting = false;
  let stateTimer = null;
  let textTimer = null;
  let typed = '';
  let typedTimer = null;
  let wheel = { dx: 0, dy: 0, nx: 0, ny: 0, timer: null };
  let toastTimer = null;
  let iconDone = false;

  function toast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 3500);
  }

  function setStatus(key, label) {
    els.status.dataset.state = key;
    els.status.textContent = label;
  }

  function overlay(title, text, { restore = false, retry = false, pick = false } = {}) {
    if (!title) { els.overlay.hidden = true; return; }
    els.overlayTitle.textContent = title;
    els.overlayText.textContent = text || '';
    els.overlayRestore.hidden = !restore;
    els.overlayRetry.hidden = !retry;
    els.overlayPick.hidden = !pick;
    els.overlay.hidden = false;
  }


  async function refreshState() {
    let s;
    try { s = await api.call('state'); } catch (err) { s = { success: false, error: String(err && err.message || err) }; }
    if (!s || !s.success) { setStatus('error', 'Unavailable'); overlay('This tab cannot reach LumaBrowser', s && s.error ? s.error : '', { retry: true }); return;
    }
    const wasAlive = state && state.alive;
    state = s;
    const name = s.app ? s.app.name : '';
    const title = s.title || (s.alive ? name : '');
    document.title = title || name || 'Window';
    els.title.textContent = title || (s.alive ? 'Untitled window' : 'Window closed');
    els.meta.textContent = s.alive ? `Live view of ${name ? `${name}'s window` : 'a desktop window'} in LumaBrowser.` : 'This window is no longer open.';
    els.restore.hidden = !(s.alive && s.minimized);
    const allowed = s.control && s.control.allowed;
    els.control.disabled = !allowed && !control;
    els.control.title = allowed ? 'Send your clicks, keys and scrolling on the view to the window' : (s.control && s.control.reason) || 'Passing input through is not available';
    if (!allowed && control) setControl(false);
    if (!s.alive) {
      stopCapture();
      setStatus('closed', 'Closed');
      overlay('This window is no longer open', 'Pick another window to show here, or close the tab.', { pick: true });
      els.text.textContent = '';
      return;
    }
    if (!iconDone) loadIcon();
    if (s.minimized) {
      setStatus('minimized', 'Minimized');
      overlay('The window is minimized', 'Its picture pauses while it sits in the taskbar.', { restore: true });
    } else if (stream) {
      setStatus('live', 'Live');
      overlay(null);
    }
    if (!stream && !starting) startCapture();
    if (!wasAlive) scheduleText(0);
  }

  function scheduleState() {
    clearTimeout(stateTimer);
    stateTimer = setTimeout(async () => { await refreshState(); scheduleState(); }, document.visibilityState === 'visible' ? STATE_VISIBLE_MS : STATE_HIDDEN_MS);
  }

  async function loadIcon() {
    iconDone = true;
    try {
      const r = await api.call('icon');
      if (r && r.dataUrl) { els.icon.href = r.dataUrl; els.appIcon.src = r.dataUrl; els.appIcon.hidden = false; }
    } catch (_) {}
  }


  async function startCapture() {
    if (!hwnd || starting) return;
    starting = true;
    setStatus('starting', 'Starting');
    overlay('Starting the capture', 'One moment.');
    try {
      const fps = state && state.frameRate ? state.frameRate : 30;
      const media = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: fps, max: 60 } }, audio: false });
      stream = media;
      els.video.srcObject = media;
      els.video.classList.remove('off');
      const track = media.getVideoTracks()[0];
      if (track) track.addEventListener('ended', () => { stopCapture(); if (state && state.alive) overlay('The capture ended', 'The window may have been recreated.', { retry: true }); });
      setStatus('live', 'Live');
      overlay(null);
    } catch (err) {
      setStatus('error', 'No picture');
      overlay('The window could not be captured', String((err && err.message) || err), { retry: true, pick: true });
    } finally {
      starting = false;
    }
  }

  function stopCapture() {
    if (stream) { try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {} }
    stream = null;
    els.video.srcObject = null;
    els.video.classList.add('off');
  }


  async function refreshText() {
    if (!state || !state.alive) return;
    let r;
    try { r = await api.call('text'); } catch (err) { r = { success: false, error: String(err && err.message || err) }; }
    if (!r || !r.success) { els.textNote.textContent = (r && r.error) || 'The window text could not be read.'; return; }
    els.text.textContent = r.text || '';
    els.textNote.textContent = r.text ? ((r.notes || []).join('; ')) : 'The window exposes no accessible text.';
  }

  function scheduleText(delay) {
    clearTimeout(textTimer);
    textTimer = setTimeout(async () => {
      await refreshText();
      const sec = state && state.textRefreshSec ? state.textRefreshSec : 10;
      scheduleText(document.visibilityState === 'visible' ? sec * 1000 : HIDDEN_TEXT_MS);
    }, delay);
  }


  function setControl(on) {
    control = !!on;
    els.control.setAttribute('aria-pressed', control ? 'true' : 'false');
    els.stage.classList.toggle('control', control);
    els.hint.hidden = !control;
    if (control) els.stage.focus();
    else flushTyped();
  }

  function pointOf(e) {
    const r = els.video.getBoundingClientRect();
    const vw = els.video.videoWidth;
    const vh = els.video.videoHeight;
    if (!vw || !vh || !r.width || !r.height) return null;
    const scale = Math.min(r.width / vw, r.height / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const ox = r.left + (r.width - dw) / 2;
    const oy = r.top + (r.height - dh) / 2;
    const nx = (e.clientX - ox) / dw;
    const ny = (e.clientY - oy) / dh;
    if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
    return { nx, ny };
  }

  async function send(event) {
    try {
      const r = await api.call('input', event);
      if (!r || !r.success) toast((r && r.error) || 'The window did not take that.');
      return r;
    } catch (err) {
      toast(String((err && err.message) || err));
      return null;
    }
  }

  function flushTyped() {
    clearTimeout(typedTimer);
    typedTimer = null;
    if (!typed) return;
    const text = typed;
    typed = '';
    send({ type: 'text', text });
  }

  function onKey(e) {
    if (!control || !state || !state.alive) return;
    if (MODIFIERS.has(e.key)) return;
    e.preventDefault();
    const plain = !e.ctrlKey && !e.altKey && !e.metaKey;
    if (plain && e.key.length === 1) {
      typed += e.key;
      clearTimeout(typedTimer);
      typedTimer = setTimeout(flushTyped, 160);
      return;
    }
    let key = KEY_NAMES[e.key];
    if (!key && /^F\d{1,2}$/.test(e.key)) key = e.key.toLowerCase();
    if (!key && e.key.length === 1) key = e.key.toLowerCase();
    if (!key) return;
    flushTyped();
    const combo = [e.ctrlKey && 'ctrl', e.altKey && 'alt', e.shiftKey && 'shift', e.metaKey && 'win', key].filter(Boolean).join('+');
    send({ type: 'keys', keys: combo });
  }

  function onMouseUp(e) {
    if (!control || !state || !state.alive) return;
    const p = pointOf(e);
    if (!p) return;
    flushTyped();
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    send({ type: 'click', nx: p.nx, ny: p.ny, button });
  }

  function onWheel(e) {
    if (!control || !state || !state.alive) return;
    const p = pointOf(e);
    if (!p) return;
    e.preventDefault();
    wheel.dx += e.deltaX;
    wheel.dy += e.deltaY;
    wheel.nx = p.nx;
    wheel.ny = p.ny;
    if (wheel.timer) return;
    wheel.timer = setTimeout(() => {
      wheel.timer = null;
      const horizontal = Math.abs(wheel.dx) > Math.abs(wheel.dy);
      const delta = horizontal ? wheel.dx : wheel.dy;
      wheel.dx = 0;
      wheel.dy = 0;
      if (!delta) return;
      const direction = horizontal ? (delta > 0 ? 'right' : 'left') : (delta > 0 ? 'down' : 'up');
      send({ type: 'wheel', nx: wheel.nx, ny: wheel.ny, direction, amount: Math.max(1, Math.round(Math.abs(delta) / 100)) });
    }, 90);
  }


  async function openPicker() {
    els.picker.hidden = false;
    els.textPanel.classList.add('collapsed');
    els.textToggle.setAttribute('aria-pressed', 'false');
    els.windows.innerHTML = '';
    let r;
    try { r = await api.call('windows'); } catch (_) { r = null; }
    const list = r && r.success ? r.windows : [];
    if (!list.length) {
      const li = document.createElement('li');
      li.textContent = 'No other windows.';
      els.windows.appendChild(li);
      return;
    }
    for (const w of list) {
      const li = document.createElement('li');
      if (w.open) li.className = 'open';
      const t = document.createElement('span');
      t.className = 'w-title';
      t.textContent = w.title;
      const a = document.createElement('span');
      a.className = 'w-app';
      a.textContent = w.open ? `${w.app} (already a tab)` : w.app;
      li.appendChild(t);
      li.appendChild(a);
      li.addEventListener('click', async () => {
        const res = await api.call('open', { hwnd: w.hwnd });
        if (!res || !res.success) toast((res && res.error) || 'That window could not be opened.');
      });
      els.windows.appendChild(li);
    }
  }


  els.control.addEventListener('click', () => setControl(!control));
  els.textToggle.addEventListener('click', () => {
    const open = els.textPanel.classList.contains('collapsed');
    els.textPanel.classList.toggle('collapsed', !open);
    els.picker.hidden = true;
    els.textToggle.setAttribute('aria-pressed', open ? 'true' : 'false');
    if (open) scheduleText(0);
  });
  const restore = async () => { const r = await api.call('restore'); if (!r || !r.success) toast('Windows would not bring the window back.'); };
  els.restore.addEventListener('click', restore);
  els.overlayRestore.addEventListener('click', restore);
  els.overlayRetry.addEventListener('click', () => { stopCapture(); refreshState(); });
  els.pick.addEventListener('click', openPicker);
  els.overlayPick.addEventListener('click', openPicker);
  els.pickerClose.addEventListener('click', () => { els.picker.hidden = true; });
  els.stage.addEventListener('mouseup', onMouseUp);
  els.stage.addEventListener('contextmenu', (e) => { if (control) e.preventDefault(); });
  els.stage.addEventListener('wheel', onWheel, { passive: false });
  els.stage.addEventListener('keydown', onKey);
  els.stage.addEventListener('mousedown', () => { if (control) els.stage.focus(); });
  document.addEventListener('visibilitychange', () => { scheduleState(); scheduleText(document.visibilityState === 'visible' ? 0 : HIDDEN_TEXT_MS); });
  window.addEventListener('beforeunload', () => { stopCapture(); clearTimeout(stateTimer); clearTimeout(textTimer); });

  if (!api) {
    setStatus('error', 'Unavailable');
    overlay('This page must run inside a LumaBrowser window tab', '');
    return;
  }
  if (!hwnd) {
    setStatus('closed', 'No window');
    overlay('No window chosen', 'Pick a window to show in this tab.', { pick: true });
    scheduleState();
    return;
  }
  refreshState().then(() => { scheduleState(); scheduleText(0); });
})();
