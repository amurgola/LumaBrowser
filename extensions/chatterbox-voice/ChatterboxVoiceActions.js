const fs = require('fs');
const AudioAnalysis = require('./AudioAnalysis');
const VoicePreview = require('./VoicePreview');

class ChatterboxVoiceActions {
  static MAX_CLIP_BYTES = 12 * 1024 * 1024;
  static STT_SETUP_CODES = ['NO_STT_MODEL', 'STT_RUNTIME_MISSING'];

  constructor(host) {
    this._host = host;
    this._routes = {
      'voices.create': (p) => this._create(p),
      'voices.update': (p) => this._update(p),
      'voices.delete': (p) => this._delete(p),
      'voices.use': (p) => this._use(p),
      'voices.clip': (p) => this._clip(p),
      'voices.analyze': (p) => this._analyze(p),
      'voices.transcribe': (p) => this._transcribe(p),
      'voices.preview': (p) => VoicePreview.render({ engine: host.engine, store: host.store, voiceId: p.id, text: p.text }),
    };
  }

  handles(action) {
    return Object.prototype.hasOwnProperty.call(this._routes, action);
  }

  handle(action, payload) {
    return this._routes[action](payload);
  }

  static clipFromPayload(payload) {
    if (!payload || !payload.audioBase64) return null;
    const buf = Buffer.from(String(payload.audioBase64), 'base64');
    if (buf.length > ChatterboxVoiceActions.MAX_CLIP_BYTES) throw new Error('Reference clip is too large (12 MB max).');
    return buf;
  }

  async _create(payload) {
    const wav = ChatterboxVoiceActions.clipFromPayload(payload);
    if (!wav) throw new Error('Add a reference clip first (record one or choose an audio file).');
    const row = this._host.store.create(payload, wav);
    await this._host.stopEngine();
    if (payload.makeDefault) this._host.voice.setDefaultTtsVoice(row.id);
    return { voice: row };
  }

  async _update(payload) {
    const wav = ChatterboxVoiceActions.clipFromPayload(payload);
    const patch = { ...(payload.patch || {}) };
    if (wav && payload.trimStartSec != null) patch.trimStartSec = payload.trimStartSec;
    const row = this._host.store.update(payload.id, patch, wav);
    if (wav) await this._host.stopEngine();
    return { voice: row };
  }

  async _delete(payload) {
    const h = this._host;
    const removed = h.store.remove(payload.id);
    if (removed) {
      await h.stopEngine();
      if (h.voice.getDefaultTtsModelId() === h.voice.voiceModelId(h.extensionId, payload.id)) h.voice.setDefaultTtsVoice(null);
    }
    return { removed };
  }

  _use(payload) {
    const id = payload.id == null ? null : String(payload.id);
    if (id != null && !this._host.engine.listVoices().some((v) => v.id === id)) {
      throw new Error('That voice is not ready: download the model it needs first.');
    }
    this._host.voice.setDefaultTtsVoice(id);
    return { activeVoiceId: id };
  }

  _clip(payload) {
    const v = this._savedVoice(payload.id);
    const wav = fs.readFileSync(this._host.store.refPath(v.id));
    return { wavBase64: wav.toString('base64'), seconds: v.refSec, hz: v.refHz || null };
  }

  _analyze(payload) {
    const wav = ChatterboxVoiceActions.clipFromPayload(payload);
    if (!wav) throw new Error('No clip.');
    return AudioAnalysis.analyzeWav(wav);
  }

  async _transcribe(payload) {
    const voice = this._host.voice;
    const wav = ChatterboxVoiceActions.clipFromPayload(payload) || this._savedClip(payload.id);
    if (!wav) throw new Error('Record or choose a clip first.');
    if (typeof voice.transcribe !== 'function') throw new Error('Speech recognition is not available in this build.');
    try {
      const r = await voice.transcribe(wav, { language: payload.language || 'auto' });
      return { text: String((r && r.text) || '').trim(), durationMs: (r && r.durationMs) || 0 };
    } catch (err) {
      if (err && ChatterboxVoiceActions.STT_SETUP_CODES.includes(err.code)) {
        throw new Error('Speech recognition is not set up yet. Click the microphone in the chat once to install it, then try again.');
      }
      throw err;
    }
  }

  _savedClip(id) {
    if (!id) return null;
    return fs.readFileSync(this._host.store.refPath(this._savedVoice(id).id));
  }

  _savedVoice(id) {
    const v = this._host.store.get(id);
    if (!v) throw new Error('Voice not found.');
    return v;
  }
}

module.exports = ChatterboxVoiceActions;
