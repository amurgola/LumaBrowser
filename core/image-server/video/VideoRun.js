const LocalImageRun = require('../router/LocalImageRun');

class VideoRun extends LocalImageRun {
  static NO_OUTPUT = 'video encode produced no output.';
  static DEFAULT_MIME = 'video/webm';

  constructor({ i2v = false, ...rest }) {
    super({ ...rest, role: 'image-video' });
    this._i2v = i2v;
  }

  get progressLabel() {
    return this._i2v ? 'Animating image' : 'Generating video';
  }

  get doneLabel() {
    return 'Video generated';
  }

  get nounLabel() {
    return 'Video generation';
  }

  _complete(result) {
    this._server.markActive();
    const video = result && result.video;
    if (!video || !video.bytes) return this._failNoOutput();
    const ms = Date.now() - this._startedAt;
    this._logVideo(ms, video);
    this._notify(`${this.doneLabel} in ${(ms / 1000).toFixed(1)}s`, 'success');
    this._send('done', { video: VideoRun._toWire(video), modelId: this._wantId });
    this._finish({ success: true, video });
  }

  _failNoOutput() {
    this._send('error', { message: VideoRun.NO_OUTPUT });
    this._notify(`${this.nounLabel} failed: no output.`, 'error');
    this._finish({ success: false, error: VideoRun.NO_OUTPUT });
  }

  _logVideo(ms, video) {
    console.log(`[video-server] ${this._cold ? 'COLD' : 'warm'} request "${this._wantId}" finished in ${ms}ms`
      + ` frames=${video.frameCount} fps=${video.fps} encoder=${video.encoder}`
      + `${this._cold ? ' (incl. model load)' : ' (model already resident)'}`);
  }

  static _toWire(video) {
    return {
      b64: video.bytes.toString('base64'),
      mime: video.mime || VideoRun.DEFAULT_MIME,
      frameCount: video.frameCount || null,
      fps: video.fps || null,
      width: video.width || null,
      height: video.height || null,
      encoder: video.encoder || null,
    };
  }
}

module.exports = VideoRun;
