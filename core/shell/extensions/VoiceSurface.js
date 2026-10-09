const ContextSurface = require('./ContextSurface');
const TtsEngineRegistry = require('../../tts-server/TtsEngineRegistry');

class VoiceSurface extends ContextSurface {
  static NO_STT_MESSAGE = 'Speech recognition is not available in this build.';

  constructor({ registry = TtsEngineRegistry.shared, coreServices = {} } = {}) {
    super();
    this._registry = registry;
    this._coreServices = coreServices;
  }

  get key() {
    return 'voice';
  }

  forExtension(extensionId) {
    return {
      registerTtsEngine: (engine) => this._registry.register(engine, extensionId),
      unregisterTtsEngine: (engineId) => this._registry.unregister(engineId),
      listTtsEngines: () => this._registry.list().map((engine) => ({ id: engine.id, name: engine.name || engine.id })),
      voiceModelId: (engineId, voiceId) => TtsEngineRegistry.makeId(engineId, voiceId),
      getDefaultTtsModelId: () => this._defaultTtsModelId(),
      setDefaultTtsVoice: (voiceId) => this._setDefaultTtsVoice(extensionId, voiceId),
      transcribe: (wav, opts = {}) => this._transcribe(wav, opts),
      sttReady: () => this._sttReady(),
    };
  }

  _defaultTtsModelId() {
    const tts = this._coreServices.ttsServer;
    return tts && typeof tts.getDefaultModelId === 'function' ? tts.getDefaultModelId() : null;
  }

  _setDefaultTtsVoice(extensionId, voiceId) {
    const tts = this._coreServices.ttsServer;
    if (!tts || typeof tts.setDefaultModelId !== 'function') return false;
    tts.setDefaultModelId(voiceId == null ? '' : TtsEngineRegistry.makeId(extensionId, voiceId));
    return true;
  }

  async _transcribe(wav, opts) {
    const stt = this._coreServices.sttServer;
    if (!stt || typeof stt.transcribe !== 'function') {
      const err = new Error(VoiceSurface.NO_STT_MESSAGE);
      err.code = 'NO_STT_MODEL';
      throw err;
    }
    return stt.transcribe(wav, opts);
  }

  async _sttReady() {
    const stt = this._coreServices.sttServer;
    try {
      const view = stt && typeof stt.getView === 'function' ? await stt.getView() : null;
      return !!(view && view.runtimeReady && view.models && view.models.length);
    } catch (_) {
      return false;
    }
  }
}

module.exports = VoiceSurface;
