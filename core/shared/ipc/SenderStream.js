class SenderStream {
  static create(event, channel, base = {}) {
    const sender = event && event.sender;
    return (type, payload) => SenderStream._send(sender, channel, { ...base, type, payload: payload || {} });
  }

  static _send(sender, channel, message) {
    try {
      if (sender && !sender.isDestroyed()) sender.send(channel, message);
    } catch (_) {
    }
  }
}

module.exports = SenderStream;
