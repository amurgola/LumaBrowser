const RpDebug = require('./RpDebug');

class ReactionProgress {
  constructor(emit, messageId) {
    this._emit = emit;
    this._messageId = messageId;
  }

  get messageId() {
    return this._messageId;
  }

  say(label) {
    this._send('mode:progress', { messageId: this._messageId, label });
    RpDebug.log('progress', { messageId: this._messageId, label });
  }

  done() {
    this._send('mode:progress', { messageId: this._messageId, done: true });
  }

  stage(stage, b64, mime) {
    if (!b64) return;
    this._send('mode:image-stage', { messageId: this._messageId, stage, b64, mime: mime || 'image/png' });
  }

  feedback(label, stage) {
    return {
      onStatus: (status) => this._onStatus(label, status),
      onProgress: (p) => this.say(label + ReactionProgress._stepSuffix(p)),
      onPreview: (p) => { if (p && p.b64) this.stage(stage || 'sampling', p.b64, p.mime); },
    };
  }

  _onStatus(label, status) {
    const phase = status && status.phase;
    if (phase === 'starting-server') this.say('Loading the image model…');
    else if (phase === 'switching-model') this.say('Switching image models…');
    else if (phase === 'native-resolution') this.say(label + ' at ' + status.to + '…');
  }

  _send(type, payload) {
    try { if (typeof this._emit === 'function') this._emit(type, payload); } catch (_) {}
  }

  static _stepSuffix(p) {
    const step = Number(p && p.step);
    const total = Number(p && p.totalSteps);
    return Number.isFinite(step) && Number.isFinite(total) && total > 0 ? ` (${Math.min(step, total)}/${total})` : '';
  }
}

module.exports = ReactionProgress;
