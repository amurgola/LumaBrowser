const RouteReply = require('../routes/RouteReply');
const SharedVoice = require('./SharedVoice');

class VoiceSynthesisStream {
  static DEFAULT_SAMPLE_RATE = 24000;

  constructor(service) {
    this._voice = new SharedVoice(service);
  }

  async run(req, res) {
    this._setupSharedVariablesFromParameters(req, res);
    const refusal = this._voice.synthesisRefusal(this._text);
    if (refusal) return RouteReply.send(res, refusal);
    this._openStream();
    if (!this._start()) return undefined;
    this._res.on('close', () => this._cancelIfUnfinished());
    return this._awaitDone();
  }

  _setupSharedVariablesFromParameters(req, res) {
    this._res = res;
    this._body = req.body || {};
    this._text = String(this._body.text || '').trim();
    this._finished = false;
    this._handle = null;
  }

  _openStream() {
    this._tts = this._voice.engines().tts;
    this._res.setHeader('Content-Type', 'application/x-ndjson');
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
  }

  _start() {
    try {
      this._handle = this._tts.synthesize({ text: this._text, sid: this._body.sid, speed: this._body.speed }, (chunk) => this._sendChunk(chunk));
      return true;
    } catch (err) {
      this._send('error', { message: err.message, code: err.code || null });
      this._finished = true;
      this._res.end();
      return false;
    }
  }

  _cancelIfUnfinished() {
    if (this._finished || !this._handle) return;
    try {
      this._tts.cancel(this._handle.id);
    } catch (_) {}
  }

  async _awaitDone() {
    try {
      const result = await this._handle.done;
      this._send('done', { canceled: !!(result && result.canceled) });
    } catch (err) {
      this._send('error', { message: err.message, code: err.code || null });
    } finally {
      this._finished = true;
      try {
        this._res.end();
      } catch (_) {}
    }
  }

  _sendChunk(chunk) {
    const pcm = chunk && chunk.pcm;
    const base64 = pcm ? Buffer.from(pcm.buffer || pcm, pcm.byteOffset || 0, pcm.byteLength).toString('base64') : '';
    this._send('chunk', { seq: chunk && chunk.seq, sampleRate: (chunk && chunk.sampleRate) || VoiceSynthesisStream.DEFAULT_SAMPLE_RATE, pcm: base64 });
  }

  _send(type, payload) {
    try {
      this._res.write(JSON.stringify({ type, payload: payload || {} }) + '\n');
    } catch (_) {}
  }
}

module.exports = VoiceSynthesisStream;
