const { EventEmitter } = require('events');

class ScreenStream extends EventEmitter {
  static SERVER_VERSION = '3.3.4';
  static DEVICE_PATH = '/data/local/tmp/luma-scrcpy-server.jar';
  static VIDEO_BIT_RATE = 8000000;
  static MAX_FPS = 60;

  constructor({ adb, tango, serverJar }) {
    super();
    this._adb = adb;
    this._tango = tango;
    this._serverJar = serverJar;
    this._client = null;
    this.width = 0;
    this.height = 0;
    this.configuration = null;
  }

  async start() {
    const { AdbScrcpyClient } = this._tango.adbScrcpy;
    await AdbScrcpyClient.pushServer(this._adb, this._jarStream(), ScreenStream.DEVICE_PATH);
    this._client = await AdbScrcpyClient.start(this._adb, ScreenStream.DEVICE_PATH, this._options());
    this._drainLog();
    await this._readVideo();
  }

  async stop() {
    if (!this._client) return;
    try { await this._client.close(); } catch (_) {}
    this._client = null;
  }

  touch(action, x, y) {
    const { AndroidMotionEventAction, ScrcpyPointerId } = this._tango.scrcpy;
    const actions = { down: AndroidMotionEventAction.Down, move: AndroidMotionEventAction.Move, up: AndroidMotionEventAction.Up };
    return this._client.controller.injectTouch({
      action: actions[action], pointerId: ScrcpyPointerId.Finger, pointerX: x, pointerY: y,
      videoWidth: this.width, videoHeight: this.height, pressure: action === 'up' ? 0 : 1, actionButton: 0, buttons: 0,
    });
  }

  key(action, code, metaState = 0) {
    const { AndroidKeyCode, AndroidKeyEventAction } = this._tango.scrcpy;
    const keyCode = AndroidKeyCode[code];
    if (keyCode === undefined) return Promise.resolve();
    return this._client.controller.injectKeyCode({
      action: action === 'up' ? AndroidKeyEventAction.Up : AndroidKeyEventAction.Down, keyCode, repeat: 0, metaState,
    });
  }

  async pressKey(code) {
    await this.key('down', code);
    await this.key('up', code);
  }

  text(text) {
    return this._client.controller.injectText(String(text));
  }

  scroll(x, y, deltaX, deltaY) {
    return this._client.controller.injectScroll({
      pointerX: x, pointerY: y, videoWidth: this.width, videoHeight: this.height, scrollX: deltaX, scrollY: deltaY, buttons: 0,
    });
  }

  requestKeyframe() {
    return this._client.controller.resetVideo();
  }

  handlePacket(packet) {
    if (packet.type === 'configuration') {
      this.configuration = this._describe(packet.data);
      this.width = this.configuration.width;
      this.height = this.configuration.height;
      this.emit('configuration', this.configuration);
      return;
    }
    this.emit('frame', { keyframe: packet.keyframe === true, ptsMicros: Number(packet.pts || 0), data: packet.data });
  }

  _options() {
    return new this._tango.adbScrcpy.AdbScrcpyOptions3_3_3({
      audio: false, clipboardAutosync: false, stayAwake: true, powerOffOnClose: false,
      maxSize: 0, videoBitRate: ScreenStream.VIDEO_BIT_RATE, maxFps: ScreenStream.MAX_FPS,
    }, { version: ScreenStream.SERVER_VERSION });
  }

  _jarStream() {
    const bytes = new Uint8Array(this._serverJar);
    return new this._tango.streams.ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  }

  _drainLog() {
    const { WritableStream } = this._tango.streams;
    void this._client.output.pipeTo(new WritableStream({ write: (line) => { this.emit('log', line); } })).catch(() => {});
  }

  async _readVideo() {
    const { WritableStream } = this._tango.streams;
    const video = await this._client.videoStream;
    void video.stream.pipeTo(new WritableStream({ write: (packet) => this.handlePacket(packet) }))
      .then(() => this.emit('ended'), (error) => this.emit('ended', error));
  }

  _describe(data) {
    const parsed = this._tango.scrcpy.h264ParseConfiguration(data);
    const hex = (value) => value.toString(16).padStart(2, '0');
    return {
      codec: `avc1.${hex(parsed.profileIndex)}${hex(parsed.constraintSet)}${hex(parsed.levelIndex)}`,
      width: parsed.croppedWidth,
      height: parsed.croppedHeight,
      data,
    };
  }
}

module.exports = ScreenStream;
