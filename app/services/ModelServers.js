const LLMServerService = require('../../core/llm-server/LLMServerService');
const ImageServerService = require('../../core/image-server/ImageServerService');
const MusicServerService = require('../../core/music-server/MusicServerService');
const WhisperServerService = require('../../core/whisper-server/WhisperServerService');
const TtsServerService = require('../../core/tts-server/TtsServerService');
const GroundingServerService = require('../../core/grounding-server/GroundingServerService');
const AppGlobals = require('../AppGlobals');

class ModelServers {
  static GROUNDING_SLOT = 'visual-grounding';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._buildLlmServer();
    this._buildMediaServers();
    this._buildVoiceServers();
    this._buildGroundingServer();
    this._claimGroundingSlot();
    this._publish();
    return this._s;
  }

  _buildLlmServer() {
    const llm = new LLMServerService(this._db, {
      rootDir: this._ctx.path('core', 'llm-server'),
      apiSecurity: this._s.apiSecurity,
    });
    this._s.llmService.setLlmServerService(llm);
    llm.setQueueManager(this._s.llmQueueManager);
    this._s.llmServerService = llm;
  }

  _buildMediaServers() {
    const getDiagnostics = () => this._s.llmServerService.ensureDiagnostics();
    this._s.imageServerService = new ImageServerService(this._db, { apiSecurity: this._s.apiSecurity, getDiagnostics });
    this._s.musicServerService = new MusicServerService({ settingsDb: this._db, getDiagnostics });
  }

  _buildVoiceServers() {
    this._s.whisperServerService = new WhisperServerService(this._db);
    this._s.ttsServerService = new TtsServerService(this._db);
  }

  _buildGroundingServer() {
    this._s.groundingServerService = new GroundingServerService({ settingsDb: this._db, llmServerService: this._s.llmServerService });
    this._s.llmService.setGroundingServerService(this._s.groundingServerService);
  }

  _claimGroundingSlot() {
    const grounding = this._s.groundingServerService;
    if (!grounding.isConfigured()) return false;
    if (this._db.get(`core.llm.slots.${ModelServers.GROUNDING_SLOT}.provider`, '')) return false;
    this._s.llmService.setSlotConfig(ModelServers.GROUNDING_SLOT, GroundingServerService.PROVIDER_ID, grounding.computeProviderEntry().selectedModel);
    return true;
  }

  _publish() {
    AppGlobals.publish('__lumaLlmServerService', this._s.llmServerService);
    AppGlobals.publish('__lumaImageServerService', this._s.imageServerService);
    AppGlobals.publish('__lumaGroundingServer', this._s.groundingServerService);
  }
}

module.exports = ModelServers;
