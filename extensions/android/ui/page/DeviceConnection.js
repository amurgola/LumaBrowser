export default class DeviceConnection {
  static CONFIGURATION = 0;
  static KEYFRAME = 1;
  static HEADER_BYTES = 17;

  constructor(api, deviceName, handlers, { openSocket = (url) => new WebSocket(url) } = {}) {
    this._api = api;
    this._deviceName = deviceName;
    this._handlers = handlers;
    this._openSocket = openSocket;
    this._socket = null;
  }

  async open() {
    const socket = this._openSocket(this._api.socketUrl(await this._api.ticket(this._deviceName)));
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('message', (event) => this._receive(event.data));
    socket.addEventListener('close', () => this._handlers.closed());
    this._socket = socket;
  }

  send(message) {
    if (this._socket && this._socket.readyState === 1) this._socket.send(JSON.stringify(message));
  }

  _receive(data) {
    if (typeof data === 'string') { this._handlers.message(JSON.parse(data)); return; }
    const packet = DeviceConnection.readPacket(data);
    if (packet.kind === DeviceConnection.CONFIGURATION) this._handlers.configurationBytes(packet.bytes);
    else this._handlers.frame({ keyframe: packet.kind === DeviceConnection.KEYFRAME, ptsMicros: packet.ptsMicros, bytes: packet.bytes });
  }

  static readPacket(buffer) {
    const view = new DataView(buffer);
    return {
      kind: view.getUint8(0),
      ptsMicros: view.getFloat64(1),
      sentAtMs: view.getFloat64(9),
      bytes: new Uint8Array(buffer, DeviceConnection.HEADER_BYTES),
    };
  }
}
