const fs = require('fs');
const path = require('path');
const AudioCppInstallation = require('./AudioCppInstallation');
const AudioCppLaunch = require('./AudioCppLaunch');
const AudioCppServer = require('./AudioCppServer');
const ChatterboxModels = require('./ChatterboxModels');
const ChatterboxSpeechRequest = require('./ChatterboxSpeechRequest');

class ChatterboxEngine {
  static TURBO_VOICE_ID = ChatterboxSpeechRequest.TURBO_VOICE_ID;

  constructor({ store, runtimesDir, modelsDir, preferredRuntimeId, idleMs, log }) {
    this.id = 'chatterbox-voice';
    this.name = 'Chatterbox';
    this.store = store;
    this.server = new AudioCppServer();
    this._runtimesDir = runtimesDir;
    this._modelsDir = modelsDir;
    this._preferredRuntimeId = preferredRuntimeId;
    this._idleMs = idleMs;
    this._log = log || (() => {});
    this._ensureChain = Promise.resolve();
    this._inflight = new Map();
    this._reqCounter = 0;
    this._configStamp = null;
  }

  listVoices() {
    const out = [];
    if (this._hasModel('chatterbox-turbo')) out.push(ChatterboxEngine._turboVoice());
    if (this._hasModel('chatterbox')) for (const v of this.store.list()) out.push(ChatterboxEngine._cloneVoice(v));
    return out;
  }

  isReady(voiceId) {
    if (!this._findVoice(voiceId)) return { ready: false, code: 'NO_TTS_MODEL', error: 'That Chatterbox voice is not available.' };
    if (!AudioCppInstallation.findInstalledRuntime(this._runtimesDir(), this._preferredRuntimeId())) {
      return { ready: false, code: 'TTS_RUNTIME_MISSING', error: 'The Chatterbox engine (audio.cpp) is not installed.' };
    }
    return { ready: true };
  }

  async prewarm(voiceId) {
    await this.ensureRunning();
    const voice = this._findVoice(voiceId);
    if (voice) {
      try { await this._speak({ voiceId: voice.id, text: 'Ready.', speed: 1 }, () => {}, null); } catch (err) { this._log(`prewarm: ${err.message}`); }
    }
    return { modelId: voiceId, port: this.server.port, runtimeId: this.server.plan && this.server.plan.runtimeId };
  }

  synthesize({ voiceId, text, speed }, onChunk) {
    const id = `cb-${++this._reqCounter}`;
    const done = (async () => {
      await this.ensureRunning();
      this.server.markActive();
      try {
        return { canceled: await this._speak({ voiceId, text, speed }, onChunk, id) };
      } finally {
        this.server.markActive();
      }
    })();
    return { id, done };
  }

  cancel(id) {
    const req = this._inflight.get(id);
    if (!req) return;
    this._inflight.delete(id);
    try { req.destroy(new Error('canceled')); } catch (_) {}
  }

  async stop() {
    for (const [, req] of this._inflight) { try { req.destroy(new Error('stopped')); } catch (_) {} }
    this._inflight.clear();
    this._configStamp = null;
    await this.server.stop();
  }

  ensureRunning() {
    this._ensureChain = this._ensureChain.catch(() => {}).then(() => this._ensureInner());
    return this._ensureChain;
  }

  getStatus() {
    return this.server.getStatus();
  }

  async _ensureInner() {
    const voices = this._voicesForLaunch();
    const stamp = JSON.stringify([this._preferredRuntimeId(), voices.map((v) => v.id)]);
    const rs = this.server;
    if (rs.state === 'ready' && this._configStamp === stamp) { rs.markActive(); return rs.getStatus(); }
    if (rs.state !== 'idle' && rs.state !== 'error') { try { await rs.stop(); } catch (_) {} }
    const launch = await AudioCppLaunch.resolve({
      runtimesRoot: this._runtimesDir(),
      modelsDir: this._modelsDir(),
      voices,
      preferredRuntimeId: this._preferredRuntimeId(),
    });
    await rs.start(launch);
    rs.setIdleTimeout(this._idleMs());
    this._configStamp = stamp;
    return rs.getStatus();
  }

  _voicesForLaunch() {
    return this.store.list().map((v) => ({ id: v.id, refPath: this.store.refPath(v.id), referenceText: v.referenceText || '' }));
  }

  _speak({ voiceId, text, speed }, onChunk, id) {
    if (!String(text || '').trim()) return Promise.resolve(false);
    const { body, error } = ChatterboxSpeechRequest.buildBody({ voiceId, text, speed }, this.store);
    if (error) return Promise.reject(error);
    return ChatterboxSpeechRequest.send({
      port: this.server.port,
      body,
      onChunk,
      track: (req) => { if (id) this._inflight.set(id, req); },
      untrack: () => { if (id) this._inflight.delete(id); },
    });
  }

  _findVoice(voiceId) {
    return this.listVoices().find((v) => v.id === String(voiceId)) || null;
  }

  _hasModel(modelId) {
    return fs.existsSync(path.join(this._modelsDir(), ChatterboxModels.getModelById(modelId).file));
  }

  static _turboVoice() {
    return {
      id: ChatterboxEngine.TURBO_VOICE_ID,
      name: 'Chatterbox Turbo (built-in voice)',
      description: 'Fast English voice with a fixed speaker.',
      language: 'en',
      quality: 'turbo',
    };
  }

  static _cloneVoice(v) {
    return {
      id: v.id,
      name: v.name,
      description: v.description || `Cloned voice (${v.refSec || '?'} s reference)`,
      language: v.language || 'en',
      quality: 'clone',
    };
  }
}

module.exports = ChatterboxEngine;
