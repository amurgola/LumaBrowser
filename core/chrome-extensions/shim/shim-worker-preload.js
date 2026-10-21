(function () {
  let contextBridge;
  let ipcRenderer;
  try {
    ({ contextBridge, ipcRenderer } = require('electron'));
  } catch (_) {
    return;
  }
  if (!contextBridge || !ipcRenderer || typeof ipcRenderer.invoke !== 'function') return;

  const CALL = 'luma-shim:call';
  const EVENT = 'luma-shim:event';
  const listeners = new Set();
  ipcRenderer.on(EVENT, (_event, message) => {
    for (const fn of [...listeners]) {
      try { fn(message); } catch (err) { console.error('[luma-shim] event listener failed:', err); }
    }
  });

  try {
    contextBridge.exposeInMainWorld('lumaShim', {
      call: (ns, op, args) => ipcRenderer.invoke(CALL, { ns, op, args }),
      onEvent: (fn) => { if (typeof fn === 'function') listeners.add(fn); },
    });
  } catch (err) {
    console.warn('[luma-shim] bridge not exposed:', err && err.message);
  }
})();
