const http = require('http');
const CoreRequire = require('./CoreRequire');
const ChatterboxModels = require('./ChatterboxModels');
const PcmChunker = require('./PcmChunker');

const WavCodec = CoreRequire.load('shared/audio/WavCodec');

class ChatterboxSpeechRequest {
  static TURBO_VOICE_ID = 'turbo';
  static KITTEN_VOICE_ID = 'kitten';
  static REQUEST_TIMEOUT_MS = 120 * 1000;

  static buildBody({ voiceId, text, speed }, store, { kittenPreset = null, cloneModelId = 'chatterbox' } = {}) {
    const body = { input: String(text || '').trim(), response_format: 'wav' };
    const id = String(voiceId);
    if (id === ChatterboxSpeechRequest.TURBO_VOICE_ID) {
      body.model = 'chatterbox-turbo';
    } else if (id === ChatterboxSpeechRequest.KITTEN_VOICE_ID) {
      body.model = ChatterboxModels.KITTEN_ID;
      body.voice = ChatterboxModels.presetFor(ChatterboxModels.getModelById(ChatterboxModels.KITTEN_ID), kittenPreset);
    } else {
      const v = store.get(voiceId);
      if (!v) return { error: Object.assign(new Error('Cloned voice not found.'), { code: 'NO_TTS_MODEL' }) };
      const error = ChatterboxSpeechRequest._addClone(body, v, store, cloneModelId || 'chatterbox');
      if (error) return { error };
    }
    ChatterboxSpeechRequest._addSpeed(body, speed);
    return { body };
  }

  static send({ port, body, onChunk, track, untrack }) {
    return new Promise((resolve, reject) => {
      const payload = Buffer.from(JSON.stringify(body), 'utf8');
      const req = http.request({
        host: '127.0.0.1', port, path: '/v1/audio/speech', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
        timeout: ChatterboxSpeechRequest.REQUEST_TIMEOUT_MS,
      }, (res) => ChatterboxSpeechRequest._readReply(res, { onChunk, untrack, resolve, reject }));
      req.on('timeout', () => req.destroy(new Error('Chatterbox engine request timed out')));
      req.on('error', (err) => {
        untrack();
        if (/canceled|stopped/.test(err.message)) resolve(true); else reject(err);
      });
      track(req);
      req.end(payload);
    });
  }

  static _addClone(body, v, store, modelId) {
    body.model = modelId;
    body.voice_ref = { type: 'path', path: store.refPath(v.id).replace(/\\/g, '/') };
    if (v.referenceText) body.reference_text = v.referenceText;
    if (modelId === ChatterboxModels.KITTEN_ID) {
      if (v.referenceText) return null;
      return Object.assign(new Error(`KittenTTS 2 needs the transcript of the reference clip for "${v.name}": open the voice, fill in "What the clip says" and save.`), { code: 'NO_REFERENCE_TEXT' });
    }
    if (v.language && v.language !== 'en') body.language = v.language;
    return null;
  }

  static _addSpeed(body, speed) {
    const s = Number(speed);
    if (!Number.isFinite(s) || s <= 0 || Math.abs(s - 1) <= 0.01) return;
    if (!ChatterboxModels.acceptsSpeed(body.model)) return;
    body.speed = Math.min(2, Math.max(0.5, s));
  }

  static _readReply(res, { onChunk, untrack, resolve, reject }) {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      untrack();
      const buf = Buffer.concat(chunks);
      if (res.statusCode !== 200) {
        reject(new Error(`Chatterbox engine HTTP ${res.statusCode}: ${ChatterboxSpeechRequest._errorMessage(buf)}`));
        return;
      }
      let wav;
      try { wav = WavCodec.parse(buf); } catch (err) { reject(new Error(`Chatterbox engine returned no audio: ${err.message}`)); return; }
      PcmChunker.deliver(wav, onChunk);
      resolve(false);
    });
  }

  static _errorMessage(buf) {
    const raw = buf.toString('utf8').slice(0, 300);
    try { return JSON.parse(raw).error.message || raw; } catch (_) { return raw; }
  }
}

module.exports = ChatterboxSpeechRequest;
