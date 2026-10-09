class RuntimeTraceScripts {
  static TOAST_ID = 'lumaRuntimeTraceToast';

  static RENDERER_INSTALL = `(() => {
  const state = window.__lumaRuntimeTrace = {
    started: performance.now(), longTasks: [], frameGaps: [], slowEvents: [],
    resizeEvents: 0, mouseMoves: 0, boundsCalcs: 0, boundsCalcMs: 0, boundsSends: 0, stopped: false,
  };
  const observers = [];
  try {
    const lt = new PerformanceObserver(list => {
      for (const e of list.getEntries()) state.longTasks.push({ start: e.startTime, duration: e.duration });
    });
    lt.observe({ type: 'longtask', buffered: false });
    observers.push(lt);
  } catch (_) {}
  try {
    const ev = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        state.slowEvents.push({ start: e.startTime, duration: e.duration, type: e.name,
          target: e.target ? (e.target.id ? '#' + e.target.id : e.target.tagName) : null });
      }
    });
    ev.observe({ type: 'event', durationThreshold: 32, buffered: false });
    observers.push(ev);
  } catch (_) {}
  const onResize = () => { state.resizeEvents++; };
  const onMove = () => { state.mouseMoves++; };
  window.addEventListener('resize', onResize, true);
  window.addEventListener('mousemove', onMove, true);
  let lastFrame = performance.now();
  let lastSent = typeof lastBoundsSent === 'undefined' ? null : lastBoundsSent;
  const tick = now => {
    if (state.stopped) return;
    const gap = now - lastFrame;
    if (gap > 33) state.frameGaps.push({ start: lastFrame, gap });
    lastFrame = now;
    if (typeof lastBoundsSent !== 'undefined' && lastBoundsSent !== lastSent) { lastSent = lastBoundsSent; state.boundsSends++; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  let restoreBounds = null;
  if (typeof computeViewBounds === 'function') {
    const original = computeViewBounds;
    computeViewBounds = function () {
      const start = performance.now();
      state.boundsCalcs++;
      try { return original.apply(this, arguments); } finally { state.boundsCalcMs += performance.now() - start; }
    };
    restoreBounds = () => { computeViewBounds = original; };
  }
  state.stop = () => {
    state.stopped = true;
    for (const o of observers) { try { o.disconnect(); } catch (_) {} }
    window.removeEventListener('resize', onResize, true);
    window.removeEventListener('mousemove', onMove, true);
    if (restoreBounds) restoreBounds();
    const { stop, ...data } = state;
    data.ended = performance.now();
    return data;
  };
  return true;
})()`;

  static RENDERER_STOP = 'window.__lumaRuntimeTrace && window.__lumaRuntimeTrace.stop ? window.__lumaRuntimeTrace.stop() : null';

  static toast(text, ttlMs) {
    const id = JSON.stringify(RuntimeTraceScripts.TOAST_ID);
    const ttl = Number(ttlMs) || 0;
    return `(() => {
  let el = document.getElementById(${id});
  if (!el) {
    el = document.createElement('div');
    el.id = ${id};
    el.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;' +
      'padding:8px 14px;border-radius:8px;background:rgba(20,20,24,.92);color:#fff;font:13px/1.4 system-ui;' +
      'pointer-events:none;max-width:70vw;white-space:pre-wrap;box-shadow:0 4px 18px rgba(0,0,0,.35)';
    document.body.appendChild(el);
  }
  el.textContent = ${JSON.stringify(text)};
  clearTimeout(el.__ttl);
  if (${ttl} > 0) el.__ttl = setTimeout(() => el.remove(), ${ttl});
  return true;
})()`;
  }
}

module.exports = RuntimeTraceScripts;
