export default class VideoPlayer {
  constructor(canvas) {
    this._canvas = canvas;
    this._context = canvas.getContext('2d');
    this._decoder = null;
    this._configurationBytes = null;
    this._waitingForKeyframe = true;
    this.onFirstFrame = () => {};
  }

  configure({ codec, width, height }) {
    if (this._decoder && this._decoder.state !== 'closed') this._decoder.close();
    this._resize(width, height);
    this._decoder = new VideoDecoder({ output: (frame) => this._paint(frame), error: () => {} });
    this._decoder.configure({ codec, optimizeForLatency: true });
    this._waitingForKeyframe = true;
  }

  setConfigurationBytes(bytes) {
    this._configurationBytes = bytes;
  }

  decode({ keyframe, ptsMicros, bytes }) {
    if (!this._decoder || this._decoder.state !== 'configured') return;
    if (this._waitingForKeyframe && !keyframe) return;
    this._waitingForKeyframe = false;
    this._decoder.decode(new EncodedVideoChunk({
      type: keyframe ? 'key' : 'delta',
      timestamp: ptsMicros,
      data: keyframe ? VideoPlayer.joined(this._configurationBytes, bytes) : bytes,
    }));
  }

  static joined(first, second) {
    if (!first) return second;
    const bytes = new Uint8Array(first.length + second.length);
    bytes.set(first, 0);
    bytes.set(second, first.length);
    return bytes;
  }

  _paint(frame) {
    this._resize(frame.displayWidth, frame.displayHeight);
    this._context.drawImage(frame, 0, 0);
    frame.close();
    this.onFirstFrame();
    this.onFirstFrame = () => {};
  }

  _resize(width, height) {
    if (this._canvas.width === width && this._canvas.height === height) return;
    this._canvas.width = width;
    this._canvas.height = height;
  }
}
