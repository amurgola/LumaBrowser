(function () {
  'use strict';
  const vscode = acquireVsCodeApi();
  window.__lumaSend = function (s) {
    try { vscode.postMessage(JSON.parse(s)); } catch (_) {}
  };
  window.addEventListener('message', function (e) {
    if (window.__luma && e.data && typeof e.data === 'object') window.__luma.dispatch(e.data);
  });
  function syncTheme() {
    const c = document.body.classList;
    const light = c.contains('vscode-light') || c.contains('vscode-high-contrast-light');
    if (light) document.documentElement.setAttribute('data-light', '1');
    else document.documentElement.removeAttribute('data-light');
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
