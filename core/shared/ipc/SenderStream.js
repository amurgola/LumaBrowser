class SenderStream {
  static _observers = new Set();

  static create(event, channel, base = {}) {
    const sender = event && event.sender;
    return (type, payload) => SenderStream._send(sender, channel, { ...base, type, payload: payload || {} });
  }

  static observe(fn) {
    if (typeof fn !== 'function') return () => {};
    SenderStream._observers.add(fn);
    return () => { SenderStream._observers.delete(fn); };
  }

  static _send(sender, channel, message) {
    for (const fn of SenderStream._observers) {
      try { fn(channel, message); } catch (_) {}
    }
    try {
      if (sender && !sender.isDestroyed()) sender.send(channel, message);
    } catch (_) {
    }
  }
}

module.exports = SenderStream;
