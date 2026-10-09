(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const stage = $('stage');
  const frame = $('frame');
  const video = $('video');
  const kbd = $('kbd');
  const titleEl = $('title');
  const statusText = $('statusText');
  const modeBadge = $('modeBadge');
  const overlayTitle = $('overlayTitle');
  const overlayText = $('overlayText');

  const token = (location.pathname.match(/\/tab\/([a-f0-9]{32})/) || [])[1];
  const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/tab/${token}/ws`;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) body.classList.add('is-touch');

  const state = {
    ws: null, mode: 'view', ended: false, retry: 0, timer: null, ping: null,
    meta: { w: 0, h: 0, vw: 0, vh: 0 }, lastUrl: null, frames: 0,
    rtc: { pc: null, up: false, attempts: 0, offered: false, retryTimer: null },
  };
  const canRtc = typeof RTCPeerConnection === 'function';


  function setStatus(text, cls) {
    statusText.textContent = text;
    body.classList.remove('is-live', 'is-ended', 'is-error');
    if (cls) body.classList.add(cls);
  }
  function showOverlay(title, text) { overlayTitle.textContent = title; overlayText.textContent = text; }
  function setMode(mode) {
    state.mode = mode === 'interact' ? 'interact' : 'view';
    body.classList.toggle('is-interact', state.mode === 'interact');
    body.classList.toggle('is-view', state.mode !== 'interact');
    modeBadge.textContent = state.mode === 'interact' ? 'Interacting' : 'Viewing';
    if (state.mode !== 'interact') closeKeyboard();
  }
  function setTitle(t) { const s = t || 'Shared tab'; titleEl.textContent = s; document.title = `${s} - Shared tab`; }


  function fitEl(el, w, h) {
    if (!w || !h) return;
    const sw = stage.clientWidth; const sh = stage.clientHeight;
    const scale = Math.min(sw / w, sh / h);
    el.style.width = `${Math.max(1, Math.floor(w * scale))}px`;
    el.style.height = `${Math.max(1, Math.floor(h * scale))}px`;
  }
  function fit() {
    fitEl(frame, state.meta.w, state.meta.h);
    if (state.rtc.up) fitEl(video, video.videoWidth, video.videoHeight);
  }
  window.addEventListener('resize', fit);
  video.addEventListener('resize', fit);
  const surface = () => (state.rtc.up ? video : frame);

  function paint(blob) {
    const url = URL.createObjectURL(blob);
    const prev = frame.src;
    frame.onload = () => { if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev); };
    frame.src = url;
    if (!state.frames++) body.classList.add('has-frame');
  }


  function send(obj) {
    if (!state.ws || state.ws.readyState !== 1) return;
    try { state.ws.send(JSON.stringify(obj)); } catch (_) {}
  }

  function connect() {
    if (state.ended || !token) return;
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    setStatus('Connecting');
    if (!state.frames) showOverlay('Connecting', 'Opening the live view of the shared tab.');
    let ws;
    try { ws = new WebSocket(wsUrl); } catch (_) { return scheduleRetry(); }
    ws.binaryType = 'blob';
    state.ws = ws;
    ws.onopen = () => {
      state.retry = 0;
      setStatus('Live', 'is-live');
      if (state.ping) clearInterval(state.ping);
      state.ping = setInterval(() => send({ t: 'ping' }), 20000);
    };
    ws.onmessage = (ev) => {
      if (ev.data instanceof Blob) { paint(ev.data); return; }
      let msg = null;
      try { msg = JSON.parse(ev.data); } catch (_) { return; }
      if (!msg) return;
      switch (msg.t) {
        case 'hello':
          setMode(msg.mode); setTitle(msg.title); state.lastUrl = msg.url || null;
          if (msg.vw && msg.vh) { state.meta.vw = msg.vw; state.meta.vh = msg.vh; }
          state.rtc.offered = !!msg.rtc;
          state.rtc.attempts = 0;
          if (msg.rtc && canRtc) rtcWant();
          break;
        case 'rtc': onRtcMessage(msg); break;
        case 'frame':
          state.meta = { w: msg.w, h: msg.h, vw: msg.vw, vh: msg.vh };
          fit();
          break;
        case 'meta': setTitle(msg.title); state.lastUrl = msg.url || null; break;
        case 'mode': setMode(msg.mode); break;
        case 'ended':
          state.ended = true;
          rtcTeardown();
          setStatus(msg.reason === 'full' ? 'Full' : 'Ended', 'is-ended');
          body.classList.remove('has-frame');
          showOverlay(
            msg.reason === 'full' ? 'Too many viewers' : 'Sharing ended',
            msg.reason === 'full'
              ? 'This tab already has the maximum number of viewers. Try again in a moment.'
              : 'The host stopped sharing this tab. Ask them for a new link if you need it again.'
          );
          break;
        default: break;
      }
    };
    ws.onclose = () => {
      if (state.ping) { clearInterval(state.ping); state.ping = null; }
      state.ws = null;
      rtcTeardown();
      if (state.ended) return;
      if (document.hidden) { setStatus('Paused'); return; }
      scheduleRetry();
    };
    ws.onerror = () => {};
  }

  function scheduleRetry() {
    if (state.ended) return;
    state.retry = Math.min(state.retry + 1, 6);
    const ms = Math.min(1000 * state.retry, 5000);
    setStatus(state.retry > 1 ? 'Reconnecting' : 'Waiting', state.retry > 2 ? 'is-error' : '');
    if (state.retry > 2) {
      showOverlay('Waiting for the tab', 'The link is valid but the tab is not available right now. The host may be restarting, or sharing may be switched off. This page keeps trying.');
    }
    state.timer = setTimeout(connect, ms);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (state.ws) { try { state.ws.close(); } catch (_) {} } }
    else if (!state.ws && !state.ended) { state.retry = 0; connect(); }
  });


  const RTC_MAX_ATTEMPTS = 2;
  const RTC_RETRY_MS = 10000;

  function rtcWant() {
    if (!canRtc || state.rtc.pc || state.ended) return;
    if (state.rtc.attempts >= RTC_MAX_ATTEMPTS) return;
    state.rtc.attempts++;
    send({ t: 'rtc', k: 'want' });
  }

  function rtcUp() {
    if (state.rtc.up) return;
    state.rtc.up = true;
    state.rtc.attempts = 0;
    body.classList.add('rtc-on');
    fit();
    send({ t: 'rtc', k: 'up' });
  }

  function rtcTeardown({ retry = false } = {}) {
    const wasUp = state.rtc.up;
    if (state.rtc.pc) { try { state.rtc.pc.close(); } catch (_) {} }
    state.rtc.pc = null;
    state.rtc.up = false;
    body.classList.remove('rtc-on');
    try { video.srcObject = null; } catch (_) {}
    if (wasUp && state.ws) send({ t: 'rtc', k: 'down' });
    fit();
    if (state.rtc.retryTimer) { clearTimeout(state.rtc.retryTimer); state.rtc.retryTimer = null; }
    if (retry && state.ws && state.rtc.offered) state.rtc.retryTimer = setTimeout(rtcWant, RTC_RETRY_MS);
  }

  async function onRtcMessage(msg) {
    if (!canRtc) return;
    switch (msg.k) {
      case 'offer': {
        if (state.rtc.pc) rtcTeardown();
        let pc;
        try { pc = new RTCPeerConnection({ iceServers: Array.isArray(msg.iceServers) ? msg.iceServers : [] }); } catch (_) { return; }
        state.rtc.pc = pc;
        pc.ontrack = (e) => { video.srcObject = e.streams[0] || new MediaStream([e.track]); video.play().catch(() => {}); };
        pc.onicecandidate = (e) => { if (e.candidate) send({ t: 'rtc', k: 'cand', cand: e.candidate.toJSON() }); };
        pc.onconnectionstatechange = () => {
          if (state.rtc.pc !== pc) return;
          if (pc.connectionState === 'failed' || pc.connectionState === 'closed') rtcTeardown({ retry: true });
          else if (pc.connectionState === 'disconnected' && state.rtc.up) {
            setTimeout(() => { if (state.rtc.pc === pc && pc.connectionState === 'disconnected') rtcTeardown({ retry: true }); }, 4000);
          }
        };
        try {
          await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ t: 'rtc', k: 'answer', sdp: pc.localDescription.sdp });
        } catch (_) { rtcTeardown({ retry: true }); }
        return;
      }
      case 'cand':
        if (state.rtc.pc && msg.cand) { try { await state.rtc.pc.addIceCandidate(msg.cand); } catch (_) {} }
        return;
      case 'state':
        if (msg.state === 'closed' || msg.state === 'failed') rtcTeardown({ retry: true });
        return;
      case 'error': case 'unavailable':
        rtcTeardown({ retry: msg.k === 'error' });
        return;
      default: return;
    }
  }

  video.addEventListener('playing', () => { if (state.rtc.pc && video.videoWidth) rtcUp(); });
  video.addEventListener('loadedmetadata', () => { if (state.rtc.pc && video.videoWidth && !video.paused) rtcUp(); });


  const TAP_MAX_MS = 600;
  const TAP_SLOP_PX = 8;
  const pointer = { down: false, id: null, type: 'mouse', x0: 0, y0: 0, t0: 0, panned: false, lastX: 0, lastY: 0, lastMove: 0 };

  function norm(ev) {
    const r = surface().getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const x = (ev.clientX - r.left) / r.width;
    const y = (ev.clientY - r.top) / r.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), rect: r };
  }
  const buttonName = (b) => (b === 2 ? 'right' : b === 1 ? 'middle' : 'left');
  const hostScale = (rect) => (state.meta.vw && rect.width ? state.meta.vw / rect.width : 1);

  stage.addEventListener('contextmenu', (e) => { if (state.mode === 'interact') e.preventDefault(); });

  stage.addEventListener('pointerdown', (e) => {
    if (state.mode !== 'interact') return;
    const p = norm(e);
    if (!p) return;
    e.preventDefault();
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    Object.assign(pointer, { down: true, id: e.pointerId, type: e.pointerType, x0: e.clientX, y0: e.clientY, t0: Date.now(), panned: false, lastX: e.clientX, lastY: e.clientY });
    if (e.pointerType === 'mouse') {
      send({ t: 'mouse', k: 'move', x: p.x, y: p.y });
      send({ t: 'mouse', k: 'down', x: p.x, y: p.y, b: buttonName(e.button), cc: e.detail === 2 ? 2 : 1 });
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (state.mode !== 'interact') return;
    const p = norm(e);
    if (!p) return;
    if (!pointer.down || pointer.id !== e.pointerId) {
      if (e.pointerType === 'mouse') {
        const now = Date.now();
        if (now - pointer.lastMove > 33) { pointer.lastMove = now; send({ t: 'mouse', k: 'move', x: p.x, y: p.y }); }
      }
      return;
    }
    e.preventDefault();
    if (pointer.type === 'mouse') {
      send({ t: 'mouse', k: 'move', x: p.x, y: p.y });
      return;
    }
    const dx = e.clientX - pointer.lastX; const dy = e.clientY - pointer.lastY;
    const moved = Math.hypot(e.clientX - pointer.x0, e.clientY - pointer.y0);
    if (!pointer.panned && moved < TAP_SLOP_PX) return;
    pointer.panned = true;
    pointer.lastX = e.clientX; pointer.lastY = e.clientY;
    const s = hostScale(p.rect);
    send({ t: 'wheel', x: p.x, y: p.y, dx: -dx * s, dy: -dy * s });
  });

  const endPointer = (e) => {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    pointer.down = false;
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    if (state.mode !== 'interact') return;
    const p = norm(e);
    if (!p) return;
    if (pointer.type === 'mouse') {
      send({ t: 'mouse', k: 'up', x: p.x, y: p.y, b: buttonName(e.button), cc: 1 });
      return;
    }
    if (!pointer.panned && Date.now() - pointer.t0 < TAP_MAX_MS && e.type !== 'pointercancel') {
      send({ t: 'click', x: p.x, y: p.y });
    }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  stage.addEventListener('wheel', (e) => {
    if (state.mode !== 'interact') return;
    const p = norm(e);
    if (!p) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? p.rect.height : 1;
    const s = hostScale(p.rect);
    send({ t: 'wheel', x: p.x, y: p.y, dx: e.deltaX * unit * s, dy: e.deltaY * unit * s });
  }, { passive: false });


  const SPECIAL = new Set(['Enter', 'Backspace', 'Tab', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
  const mods = (e) => [e.ctrlKey && 'ctrl', e.shiftKey && 'shift', e.altKey && 'alt', e.metaKey && 'meta'].filter(Boolean);

  function forwardKey(e) {
    if (state.mode !== 'interact') return false;
    const m = mods(e);
    const combo = e.ctrlKey || e.metaKey || e.altKey;
    if (SPECIAL.has(e.key)) { send({ t: 'key', key: e.key, mods: m }); return true; }
    if (e.key.length === 1) {
      if (combo) send({ t: 'key', key: e.key.toUpperCase(), mods: m });
      else send({ t: 'text', s: e.key });
      return true;
    }
    return false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.target === kbd) return;
    if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    if (forwardKey(e)) e.preventDefault();
  });

  kbd.addEventListener('input', () => {
    const s = kbd.value;
    kbd.value = '';
    if (s && state.mode === 'interact') send({ t: 'text', s });
  });
  kbd.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (SPECIAL.has(e.key) || e.ctrlKey || e.metaKey) { if (forwardKey(e)) e.preventDefault(); }
  });
  kbd.addEventListener('blur', () => body.classList.remove('kbd-open'));

  function openKeyboard() { body.classList.add('kbd-open'); kbd.focus({ preventScroll: true }); }
  function closeKeyboard() { body.classList.remove('kbd-open'); if (document.activeElement === kbd) kbd.blur(); }

  $('btnKeyboard').addEventListener('click', () => (body.classList.contains('kbd-open') ? closeKeyboard() : openKeyboard()));
  $('btnEnter').addEventListener('click', () => send({ t: 'key', key: 'Enter', mods: [] }));
  $('btnBack').addEventListener('click', () => send({ t: 'nav', a: 'back' }));
  $('btnForward').addEventListener('click', () => send({ t: 'nav', a: 'forward' }));
  $('btnReload').addEventListener('click', () => send({ t: 'nav', a: 'reload' }));

  if (!token) {
    setStatus('Invalid link', 'is-error');
    showOverlay('Invalid link', 'This address is not a tab share link.');
    return;
  }
  stage.tabIndex = 0;
  connect();
})();
