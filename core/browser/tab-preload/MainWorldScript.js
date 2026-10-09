const ClickUpSocketScript = require('./ClickUpSocketScript');

class MainWorldScript {
  static NOTIFY_KEY = '__lumaNotificationIntercept';

  static build(chromeShim, passkeyShim) {
    return `(function() {
  // Never throw out of this script: webFrame.executeJavaScript surfaces a
  // page-side throw as an internal unhandled rejection the preload's .catch
  // cannot swallow, and everything after the throwing line (including the
  // Notification override) would silently never run. The real error is
  // logged to the page console instead, which the tab view's console-message
  // hook captures per tab.
  try {
  if (window.__lumaMainWorldPatched) return;
  try {
    Object.defineProperty(window, '__lumaMainWorldPatched', { value: true });
  } catch (_) { window.__lumaMainWorldPatched = true; }

  // window.chrome's stock members (loadTimes/csi/app). The CDP copy of this
  // shim covers every frame, but in this (preload) frame Electron swaps in a
  // bare window.chrome after it ran, so apply it again here.
  try { ${chromeShim} } catch (_) {}
  try { ${passkeyShim} } catch (_) {}

  function report(payload) {
    try { window.postMessage({ ${MainWorldScript.NOTIFY_KEY}: true, payload: payload }, '*'); } catch (_) {}
  }

  var originalNotification = window.Notification;
  if (originalNotification) {
    window.Notification = class CustomNotification extends originalNotification {
      constructor(title, options = {}) {
        super(title, options);
        report({
          title: title,
          body: options.body || '',
          icon: options.icon || '',
          badge: options.badge || '',
          tag: options.tag || '',
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          data: options.data || null,
          source: window.location.hostname,
          url: window.location.href
        });
      }

      static get permission() {
        return originalNotification.permission;
      }

      static requestPermission(callback) {
        return originalNotification.requestPermission(callback);
      }
    };

    Object.defineProperty(window.Notification, 'permission', {
      get: function() {
        return originalNotification.permission;
      }
    });
  }

  // Gmail, Outlook and Teams raise their notifications through a service worker
  // registration from page scripts; wrap showNotification so those are reported
  // too (a push handled inside the worker itself never passes through here).
  try {
    var swProto = window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype;
    if (swProto && typeof swProto.showNotification === 'function') {
      var originalShow = swProto.showNotification;
      swProto.showNotification = function(title, options) {
        var o = options || {};
        report({
          title: title,
          body: o.body || '',
          icon: o.icon || '',
          badge: o.badge || '',
          tag: o.tag || '',
          requireInteraction: o.requireInteraction || false,
          silent: o.silent || false,
          data: o.data || null,
          source: window.location.hostname,
          url: window.location.href
        });
        return originalShow.apply(this, arguments);
      };
    }
  } catch (_) {}

  // ClickUp only raises browser notifications through Web Push, which Electron
  // cannot subscribe to; its websocket carries the same notifications.
  try { ${ClickUpSocketScript.build()} } catch (_) {}

  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'notification') {
        report({
          title: event.data.title || '',
          body: event.data.body || '',
          icon: event.data.icon || '',
          badge: event.data.badge || '',
          tag: event.data.tag || '',
          requireInteraction: event.data.requireInteraction || false,
          silent: event.data.silent || false,
          data: event.data.data || null,
          source: window.location.hostname,
          url: window.location.href
        });
      }
    });
  }
  } catch (e) {
    console.error('[luma-inject] main-world patch failed:', e && (e.stack || e.message || e));
  }
})();`;
  }
}

module.exports = MainWorldScript;
