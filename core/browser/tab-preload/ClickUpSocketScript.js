class ClickUpSocketScript {
  static HOST_PATTERN = '/(^|\\.)clickup\\.com$/';
  static MESSAGE_TYPE = 'notification';
  static SEEN_LIMIT = 200;

  static build() {
    return `(function(report) {
  if (!${ClickUpSocketScript.HOST_PATTERN}.test(window.location.hostname)) return;
  var NativeWebSocket = window.WebSocket;
  if (typeof NativeWebSocket !== 'function') return;

  var seen = [];
  function firstTime(key) {
    if (seen.indexOf(key) !== -1) return false;
    seen.push(key);
    if (seen.length > ${ClickUpSocketScript.SEEN_LIMIT}) seen.shift();
    return true;
  }

  // The notification object of a websocket message, or null for every other message.
  function notificationOf(data) {
    if (typeof data !== 'string' || data.indexOf('${ClickUpSocketScript.MESSAGE_TYPE}') === -1) return null;
    var message;
    try { message = JSON.parse(data); } catch (_) { return null; }
    if (!message || message.msg !== '${ClickUpSocketScript.MESSAGE_TYPE}') return null;
    // Schema 2.0.0 frames carry { msg, event: { name, payload } }; older ones put payload at the top.
    var payload = (message.event && message.event.payload) || message.payload || message.data || message;
    var notification = payload && payload.notification;
    return notification && typeof notification === 'object' ? notification : null;
  }

  function sniff(data) {
    var n = notificationOf(data);
    if (!n) return;
    var details = n.data && typeof n.data === 'object' ? n.data : {};
    var title = n.title || details.title || '';
    if (!title || details.hidden) return;
    var key = details.uuid || n.uuid || n.notification_id || details.notification_id || (title + '|' + (n.body || ''));
    if (!firstTime(key)) return;
    report({
      title: title,
      body: n.body || details.body || '',
      icon: n.icon || details.icon || '',
      badge: n.badge || '',
      tag: details.uuid || n.uuid || n.tag || '',
      requireInteraction: n.requireInteraction || false,
      silent: n.silent || false,
      data: n.data || null,
      source: window.location.hostname,
      url: n.url || details.url || window.location.href
    });
  }

  var PatchedWebSocket = class WebSocket extends NativeWebSocket {
    constructor() {
      super(...arguments);
      this.addEventListener('message', function(event) {
        try { sniff(event && event.data); } catch (_) {}
      });
    }
  };
  window.WebSocket = PatchedWebSocket;
})(report);`;
  }
}

module.exports = ClickUpSocketScript;
