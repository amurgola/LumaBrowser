const CoreRequire = require('./CoreRequire');
const NinferBytes = require('./NinferBytes');
const NinferCatalog = require('./NinferCatalog');
const NinferContextSizer = require('./NinferContextSizer');
const NinferDevicePicker = require('./NinferDevicePicker');
const NinferShell = require('./NinferShell');

const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');

class NinferLaunchPlanner {
  static DEFAULT_NATIVE_CTX = 262144;
  static DEFAULT_CONTEXT = 131072;
  static MAX_CONCURRENCY = 8;
  static DRAFT_TOKENS = 3;
  static HEALTH_TIMEOUT_MS = 8 * 60 * 1000;
  static HEALTH_TIMEOUT_9P_MS = 20 * 60 * 1000;

  constructor({ model, runtime, port, overrides, apiKey, diagnostics }) {
    this._model = model;
    this._runtime = runtime;
    this._port = port;
    this._overrides = overrides || {};
    this._apiKey = apiKey;
    this._diagnostics = diagnostics;
  }

  static plan(options) {
    return new NinferLaunchPlanner(options).execute();
  }

  execute() {
    this._validate();
    this._resolveEnvironment();
    this._sizeContext();
    this._resolveConcurrency();
    this._buildServeArgs();
    return this._wrapLaunch(this._buildPlan());
  }

  _validate() {
    const { _model: model, _runtime: runtime, _port: port } = this;
    if (!model) throw new Error('ninfer planLaunch: model is required');
    if (!runtime || !runtime.binaryPath) throw new Error('ninfer planLaunch: runtime has no binaryPath');
    if (!Array.isArray(model.weights) || !model.weights[0] || !model.weights[0].path) throw new Error('ninfer planLaunch: model has no weight path');
    if (!port || typeof port !== 'number') throw new Error('ninfer planLaunch: port is required');
  }

  _resolveEnvironment() {
    this._manifest = this._runtime.manifest || {};
    this._mode = this._manifest.mode || NinferShell.currentMode();
    const host = this._model.weights[0].path;
    this._artifact = this._mode === 'wsl' ? WslFormat.toWslPath(host) : host;
    this._device = NinferDevicePicker.pick(this._manifest, this._diagnostics);
  }

  _sizeContext() {
    const addon = this._model.addon || {};
    const requested = Number(this._overrides.contextSize);
    this._requested = requested > 0 ? Math.floor(requested) : (addon.defaultContextSize || NinferLaunchPlanner.DEFAULT_CONTEXT);
    this._weights = Number(this._model.weightsTotalBytes) || 0;
    this._fit = NinferContextSizer.fit({
      requested: this._requested,
      nativeCtx: addon.contextLength || NinferLaunchPlanner.DEFAULT_NATIVE_CTX,
      weightsBytes: this._weights,
      vramBytes: this._device.vramBytes,
    });
  }

  _resolveConcurrency() {
    const requested = Math.floor(Number(this._overrides.maxConcurrent));
    this._maxConcurrent = Number.isFinite(requested) && requested >= 1 ? Math.min(NinferLaunchPlanner.MAX_CONCURRENCY, requested) : 1;
  }

  get _apiModelName() {
    return String((this._model.addon && this._model.addon.modelId) || 'ninfer').replace(/[^A-Za-z0-9._-]/g, '-');
  }

  _buildServeArgs() {
    const ctx = String(this._fit.contextSize);
    const host = this._mode === 'wsl' ? '0.0.0.0' : '127.0.0.1';
    this._serveArgs = [
      this._artifact,
      '--model-id', this._apiModelName,
      '--host', host,
      '--port', String(this._port),
      '--max-context', ctx,
      '--kv-capacity', ctx,
      '--max-concurrency', String(this._maxConcurrent),
      '--spec', 'mtp', '--draft-tokens', String(NinferLaunchPlanner.DRAFT_TOKENS), '--lm-head-draft',
    ];
    if (this._apiKey) this._serveArgs.push('--api-key', this._apiKey);
    this._serveArgs.push(...(Array.isArray(this._runtime.extraArgs) ? this._runtime.extraArgs : []));
  }

  _notes() {
    const fmt = NinferBytes.format;
    const { _runtime: runtime, _model: model, _device: device, _fit: fit } = this;
    const where = this._mode === 'wsl' ? `WSL2 · ${this._manifest.distro}` : 'native';
    const notes = [...fit.notes];
    notes.push(`Runtime: ${runtime.name} (${where})${runtime.version ? ' @ ' + runtime.version : ''}.`);
    notes.push(`Model: ${model.name} · ${fmt(this._weights)} (${(model.addon && model.addon.quant) || 'NInfer container'}).`);
    notes.push(`Context: ${fit.contextSize.toLocaleString()} tokens, INT8 KV (~${fmt(fit.contextSize * NinferCatalog.KV_BYTES_PER_TOKEN)}); MTP speculative decoding on (3 draft tokens).`);
    if (device.index != null) notes.push(`GPU: CUDA device ${device.index}${device.name ? ' (' + device.name + ')' : ''}${device.vramBytes ? ', ' + fmt(device.vramBytes) : ''}.`);
    else notes.push('GPU: no RTX 5090 identified; the server will pick CUDA device 0.');
    notes.push(this._apiKey ? 'Auth: --api-key set from API security.' : 'Auth: loopback server without an API key.');
    return notes;
  }

  _buildPlan() {
    const { _fit: fit, _device: device } = this;
    return {
      contextSize: fit.contextSize,
      requestedContextSize: this._requested,
      mmprojPath: null,
      cacheTypeK: 'int8', cacheTypeV: 'int8',
      ngl: null,
      fullOffload: fit.fits,
      partial: null,
      gguf: null,
      singleGpu: device.index != null ? String(device.index) : null,
      flashAttn: true,
      swaFull: false,
      mtp: { enabled: true, draftTokens: NinferLaunchPlanner.DRAFT_TOKENS },
      maxConcurrent: this._maxConcurrent,
      maxConcurrentRequested: this._maxConcurrent,
      ctxPerSlot: fit.contextSize,
      apiKeyRequired: !!this._apiKey,
      skippedFlags: [],
      vramAvailableBytes: device.vramBytes || 0,
      modelEstimatedBytes: NinferContextSizer.needBytes(this._weights, fit.contextSize),
      perGpu: device.vramBytes ? [{ index: device.index, name: device.name, totalBytes: device.vramBytes }] : [],
      runtimeId: this._runtime.id,
      runtimeName: this._runtime.name,
      modelName: this._model.name,
      apiModelName: this._apiModelName,
      port: this._port,
      ninfer: true,
      mode: this._mode,
      distro: this._manifest.distro || null,
      host: '127.0.0.1',
      processPattern: 'ninfer-serve',
      cudaDevice: device.index,
      notes: this._notes(),
    };
  }

  _wrapLaunch(plan) {
    const healthTimeoutMs = (this._mode === 'wsl' && this._artifact.startsWith('/mnt/'))
      ? NinferLaunchPlanner.HEALTH_TIMEOUT_9P_MS
      : NinferLaunchPlanner.HEALTH_TIMEOUT_MS;
    const common = { plan, authKey: this._apiKey || null, healthTimeoutMs };
    if (this._mode === 'wsl') {
      return { binaryPath: NinferShell.WSL_EXE, args: this._wslArgs(), cudaDevice: null, ...common };
    }
    return { binaryPath: this._runtime.binaryPath, args: this._serveArgs, cudaDevice: this._device.index != null ? String(this._device.index) : null, ...common };
  }

  _wslArgs() {
    const q = WslFormat.shellQuote;
    const envPrefix = this._device.index != null ? `env CUDA_VISIBLE_DEVICES=${Number(this._device.index)} ` : '';
    const cmd = `exec ${envPrefix}${q(this._runtime.binaryPath)} ${this._serveArgs.map(q).join(' ')}`;
    return [...(this._manifest.distro ? ['-d', this._manifest.distro] : []), '--', 'bash', '-lc', cmd];
  }
}

module.exports = NinferLaunchPlanner;
