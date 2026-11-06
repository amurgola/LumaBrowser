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

  // Electron only knows granted or denied, so a site nobody answered for reads as denied and would never ask.
  // Pages see 'default' instead until a request from this document comes back denied (the user blocked it, or
  // the site was blocked already).
  var originalNotification = window.Notification;
  var notificationsDenied = false;
  function notificationPermission() {
    if (originalNotification.permission === 'granted') return 'granted';
    return notificationsDenied ? 'denied' : 'default';
  }
  function canNotify() {
    return !!originalNotification && originalNotification.permission === 'granted';
  }
  if (originalNotification) {
    var originalRequest = originalNotification.requestPermission.bind(originalNotification);
    window.Notification = class CustomNotification extends originalNotification {
      constructor(title, options = {}) {
        super(title, options);
        if (!canNotify()) return;
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
        return notificationPermission();
      }

      static requestPermission(callback) {
        return originalRequest().then(function(result) {
          notificationsDenied = result !== 'granted';
          var answer = notificationPermission();
          if (typeof callback === 'function') { try { callback(answer); } catch (_) {} }
          return answer;
        });
      }
    };

    Object.defineProperty(window.Notification, 'permission', {
      get: function() {
        return notificationPermission();
      }
    });

    // navigator.permissions.query({ name: 'notifications' }) tells the same story as Notification.permission.
    try {
      var perms = navigator.permissions;
      if (perms && typeof perms.query === 'function') {
        var originalQuery = perms.query.bind(perms);
        perms.query = function(descriptor) {
          return originalQuery(descriptor).then(function(status) {
            if (!descriptor || descriptor.name !== 'notifications' || status.state === 'granted' || notificationsDenied) return status;
            try { Object.defineProperty(status, 'state', { get: function() { return 'prompt'; } }); } catch (_) {}
            return status;
          });
        };
      }
    } catch (_) {}
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
        if (canNotify()) report({
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
