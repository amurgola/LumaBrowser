const PacketCodec = require('./PacketCodec');

class DeviceViewer {
  static OPEN = 1;
  static BACKLOG_BYTES = 4 * 1024 * 1024;

  constructor({ socket, session, settings, now = Date.now }) {
    this._socket = socket;
    this._session = session;
    this._settings = settings;
    this._now = now;
    this._awaitingKeyframe = true;
    this._listeners = {
      configuration: (configuration) => this._sendConfiguration(configuration),
      frame: (frame) => this._sendFrame(frame),
      ended: () => this._socket.close(),
    };
  }

  attach() {
    for (const [event, listener] of Object.entries(this._listeners)) this._session.on(event, listener);
    this._socket.on('message', (data, isBinary) => { if (!isBinary) this.receive(String(data)); });
    this._socket.on('close', () => this.detach());
    this._socket.on('error', () => {});
    this._sendJson({ type: 'hello', device: this._session.describe(), fitToFrame: this._settings.read().fitToFrame });
    if (this._session.video) {
      this._sendConfiguration(this._session.video);
      this._session.requestKeyframe().catch(() => {});
    }
  }

  detach() {
    for (const [event, listener] of Object.entries(this._listeners)) this._session.off(event, listener);
  }

  receive(text) {
    let message = null;
    try { message = JSON.parse(text); } catch (_) { return; }
    const handler = message && this._handlers()[message.type];
    if (handler) Promise.resolve().then(() => handler(message)).catch(() => {});
  }

  _handlers() {
    const session = this._session;
    return {
      touch: (m) => session.touch(m.action, m.x, m.y),
      key: (m) => session.key(m.action, m.code, m.meta),
      text: (m) => session.text(m.text),
      scroll: (m) => session.scroll(m.x, m.y, m.deltaX, m.deltaY),
      button: (m) => session.pressKey(m.name),
      resize: (m) => (this._settings.read().fitToFrame ? session.fit(m) : null),
    };
  }

  _sendConfiguration(configuration) {
    this._awaitingKeyframe = true;
    this._sendJson({ type: 'video', codec: configuration.codec, width: configuration.width, height: configuration.height });
    this._send(PacketCodec.configuration(configuration, this._now()));
  }

  _sendFrame(frame) {
    if (this._isBehind()) this._skipToKeyframe();
    if (this._awaitingKeyframe && !frame.keyframe) return;
    this._awaitingKeyframe = false;
    this._send(PacketCodec.frame(frame, this._now()));
  }

  _isBehind() {
    return !this._awaitingKeyframe && this._socket.bufferedAmount > DeviceViewer.BACKLOG_BYTES;
  }

  _skipToKeyframe() {
    this._awaitingKeyframe = true;
    this._session.requestKeyframe().catch(() => {});
  }

  _sendJson(message) {
    this._send(JSON.stringify(message));
  }

  _send(data) {
    if (this._socket.readyState !== DeviceViewer.OPEN) return;
    try { this._socket.send(data); } catch (_) {}
  }
}

module.exports = DeviceViewer;
