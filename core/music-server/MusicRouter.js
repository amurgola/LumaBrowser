const MusicModelCatalog = require('./models/MusicModelCatalog');
const SglOmniAdapter = require('./server/SglOmniAdapter');
const MusicServerGate = require('./MusicServerGate');
const MusicGenerationParams = require('./MusicGenerationParams');

class MusicRouter {
  static HEARTBEAT_MS = 10000;

  constructor({ musicServerService, notify, catalog } = {}) {
    if (!musicServerService) throw new Error('MusicRouter: musicServerService is required');
    this._svc = musicServerService;
    this._notify = typeof notify === 'function' ? notify : () => {};
    this._catalog = catalog || new MusicModelCatalog();
    this._active = null;
  }

  async generate({ lyrics, instructions, modelRef, durationSec, seed, send }) {
    const invalid = MusicRouter._validationError(lyrics, instructions);
    if (invalid) return { success: false, error: invalid };
    const emit = typeof send === 'function' ? send : () => {};
    this.abort();
    const request = { lyrics, instructions, durationSec, seed, send: emit, startedAt: Date.now() };
    request.model = this._resolveModel(modelRef, emit);
    if (!request.model.id) return { success: false, error: request.model.error };
    const serving = await new MusicServerGate(this._svc).ensureServing(request.model, emit);
    if (serving.error) return { success: false, error: serving.error };
    return this._runGeneration(request, serving);
  }

  abort() {
    if (this._active) {
      try {
        this._active.abort();
      } catch (_) {}
      this._active = null;
    }
    return { success: true };
  }

  static _validationError(lyrics, instructions) {
    if (!MusicRouter._isNonBlank(lyrics)) return 'lyrics is required';
    if (!MusicRouter._isNonBlank(instructions)) return 'instructions (style description) is required';
    return null;
  }

  static _isNonBlank(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  _resolveModel(modelRef, send) {
    const firstRow = this._catalog.list()[0] || {};
    const wantId = modelRef || this._svc.getDefaults().modelId || firstRow.id;
    const model = wantId ? this._catalog.getById(wantId) : null;
    if (model) return model;
    const error = `Music model "${wantId}" not found. Pick one in Music Setup.`;
    send('error', { message: error });
    return { error };
  }

  async _runGeneration(request, serving) {
    const call = this._buildCall(request, serving.status);
    this._announce(request, serving.status, call);
    const handle = SglOmniAdapter.generate(call);
    const heartbeat = this._startHeartbeat(request);
    const tracker = this._trackActive(handle);
    try {
      const result = await handle.promise;
      return this._onDone(request, serving.cold, result);
    } catch (err) {
      return this._onFailed(request, tracker.aborted, err);
    } finally {
      clearInterval(heartbeat);
      this._active = null;
    }
  }

  _buildCall(request, status) {
    const plan = status.plan || {};
    return {
      baseUrl: `http://${plan.host || '127.0.0.1'}:${status.port}`,
      model: plan.apiModelName || request.model.apiModelName || request.model.id,
      lyrics: request.lyrics,
      instructions: request.instructions,
      seed: MusicGenerationParams.effectiveSeed(request.seed, this._svc.getDefaults()),
      maxNewTokens: MusicGenerationParams.maxNewTokens(request.model, request.durationSec),
    };
  }

  _announce(request, status, call) {
    request.send('meta', {
      modelId: request.model.id,
      runtimeId: status.plan && status.plan.runtimeId,
      port: status.port,
      seed: call.seed != null ? call.seed : null,
      maxNewTokens: call.maxNewTokens,
    });
    request.send('status', { phase: 'generating' });
    this._notify(`Composing with "${request.model.label}"…`, 'info');
  }

  _startHeartbeat(request) {
    return setInterval(() => {
      request.send('progress', { elapsedMs: Date.now() - request.startedAt });
    }, MusicRouter.HEARTBEAT_MS);
  }

  _trackActive(handle) {
    const tracker = { aborted: false };
    this._active = {
      abort: () => {
        tracker.aborted = true;
        handle.abort();
      },
    };
    return tracker;
  }

  _onDone(request, cold, result) {
    this._svc.server.markActive();
    const ms = Date.now() - request.startedAt;
    const audio = MusicRouter._audioPayload(result.audio);
    MusicRouter._logFinished(request.model.id, cold, ms, result.audio.bytes.length, audio.durationSec);
    this._notify(`Song generated in ${(ms / 1000).toFixed(1)}s`, 'success');
    request.send('done', { audio, modelId: request.model.id });
    return { success: true, audio };
  }

  static _audioPayload(raw) {
    return {
      b64: raw.bytes.toString('base64'),
      mime: raw.mime,
      sampleRate: raw.sampleRate,
      durationSec: MusicGenerationParams.wavDurationSec(raw.bytes, raw.sampleRate),
    };
  }

  static _logFinished(modelId, cold, ms, byteCount, durationSec) {
    const duration = durationSec ? ` duration=${durationSec.toFixed(1)}s` : '';
    const load = cold ? ' (incl. model load)' : ' (model already resident)';
    console.log(`[music-server] ${cold ? 'COLD' : 'warm'} request "${modelId}" finished in ${ms}ms bytes=${byteCount}${duration}${load}`);
  }

  _onFailed(request, aborted, err) {
    const message = aborted || (err && err.code === 'ABORTED') ? 'aborted' : (err && err.message) || String(err);
    const wasAborted = message === 'aborted';
    request.send('error', { message });
    if (wasAborted) this._notify('Music generation canceled', 'info');
    else this._notify(`Music generation failed: ${message}`, 'error');
    return { success: false, error: message, aborted: wasAborted };
  }
}

module.exports = MusicRouter;
