const path = require('path');
const MediaLaunchPlanner = require('../../media-shared/MediaLaunchPlanner');
const ByteLadder = require('./ByteLadder');

class MlxLaunchPlanner extends MediaLaunchPlanner {
  static DEFAULT_CONTEXT = 4096;

  static HOST = '127.0.0.1';

  plan(options) {
    const result = super.plan(options);
    return { ...result, modelPath: this._modelPath, mmprojPath: null };
  }

  _validate() {
    this._requireOption('model');
    this._requireOption('runtime');
    const { model, runtime, port } = this._options;
    if (!runtime.binaryPath) throw new Error('MlxLaunchPlanner: runtime has no binaryPath');
    if (!Array.isArray(model.weights) || !model.weights[0] || !model.weights[0].path) {
      throw new Error('MlxLaunchPlanner: model has no weight path');
    }
    if (!port || typeof port !== 'number') throw new Error('MlxLaunchPlanner: port is required');
  }

  _resolveSettings() {
    const overrides = this._options.overrides || {};
    this._modelPath = this._options.model.weights[0].path;
    this._contextSize = MlxLaunchPlanner._contextSize(overrides.contextSize);
    this._maxConcurrent = MlxLaunchPlanner._maxConcurrent(overrides.maxConcurrent);
  }

  _buildArgs() {
    return ['--model', this._modelPath, '--host', MlxLaunchPlanner.HOST, '--port', String(this._options.port)];
  }

  _resolveBinaryPath() {
    return this._options.runtime.binaryPath;
  }

  _describePlan() {
    const { model, runtime, port } = this._options;
    const modelBytes = Number(model.weightsTotalBytes) || 0;
    return {
      contextSize: this._contextSize,
      requestedContextSize: this._contextSize,
      mmprojPath: null,
      cacheTypeK: null,
      cacheTypeV: null,
      ngl: null,
      fullOffload: true,
      partial: null,
      gguf: null,
      singleGpu: null,
      flashAttn: false,
      swaFull: false,
      mtp: null,
      maxConcurrent: this._maxConcurrent,
      maxConcurrentRequested: this._maxConcurrent,
      ctxPerSlot: this._contextSize,
      apiKeyRequired: false,
      skippedFlags: [],
      vramAvailableBytes: 0,
      modelEstimatedBytes: modelBytes,
      perGpu: [],
      runtimeId: runtime.id,
      runtimeName: runtime.name,
      modelName: model.name,
      port,
      mlx: true,
      notes: this._notes(modelBytes),
    };
  }

  _notes(modelBytes) {
    const { model, runtime } = this._options;
    return [
      `Runtime: ${runtime.name} (mlx_lm.server).`,
      `Model: ${model.name}, ${ByteLadder.format(modelBytes)} (MLX directory: ${path.basename(this._modelPath)}).`,
      'Backend: Apple Silicon unified-memory GPU; no discrete VRAM split, layers always run on the GPU.',
      `Context: up to ${this._contextSize} tokens (mlx_lm.server sizes the KV cache per request).`,
      'Auth: mlx_lm.server has no --api-key flag; the loopback server is unauthenticated.',
    ];
  }

  static _contextSize(requested) {
    return Number(requested) > 0 ? Math.floor(Number(requested)) : MlxLaunchPlanner.DEFAULT_CONTEXT;
  }

  static _maxConcurrent(requested) {
    const parallel = Math.floor(Number(requested));
    return (Number.isFinite(parallel) && parallel >= 1) ? parallel : 1;
  }
}

module.exports = MlxLaunchPlanner;
