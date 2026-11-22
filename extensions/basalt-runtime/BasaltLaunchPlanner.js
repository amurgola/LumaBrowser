const BasaltCard = require('./BasaltCard');
const BasaltContextSizer = require('./BasaltContextSizer');
const BasaltKvMode = require('./BasaltKvMode');
const BasaltModelEntries = require('./BasaltModelEntries');
const CoreRequire = require('./CoreRequire');

const LaunchFinalizer = CoreRequire.load('llm-server/server/launcher/LaunchFinalizer');
const ModelFamilies = CoreRequire.load('llm-server/server/ModelFamilies');
const UserArgs = CoreRequire.load('llm-server/server/UserArgs');

class BasaltLaunchPlanner {
  static DEFAULT_NATIVE_CTX = 262144;
  static DEFAULT_CONTEXT = 131072;
  static MAX_PARALLEL = 8;
  static HOST = '127.0.0.1';
  static SLEEP_SIZING_ON_WINDOWS = 'card';

  constructor({ model, runtime, port, overrides, apiKey, diagnostics, userArgs, platform = process.platform }) {
    this._model = model;
    this._runtime = runtime;
    this._port = port;
    this._overrides = overrides || {};
    this._apiKey = typeof apiKey === 'string' && apiKey.length > 0 ? apiKey : null;
    this._diagnostics = diagnostics;
    this._userArgs = UserArgs.normalize(userArgs);
    this._platform = platform;
  }

  static plan(options) {
    return new BasaltLaunchPlanner(options).execute();
  }

  execute() {
    this._validate();
    this._resolvePack();
    this._resolveCard();
    this._resolveSlots();
    this._resolveKv();
    this._sizeContext();
    this._resolveVision();
    this._resolveSleep();
    this._buildServeArgs();
    return this._wrapLaunch(this._buildPlan());
  }

  _validate() {
    const { _model: model, _runtime: runtime, _port: port } = this;
    if (!model) throw new Error('basalt planLaunch: model is required');
    if (!runtime || !runtime.binaryPath) throw new Error('basalt planLaunch: runtime has no binaryPath');
    if (!Array.isArray(model.weights) || !model.weights[0] || !model.weights[0].path) throw new Error('basalt planLaunch: model has no pack path');
    if (!port || typeof port !== 'number') throw new Error('basalt planLaunch: port is required');
  }

  _resolvePack() {
    this._packPath = this._model.weights[0].path;
    this._entry = BasaltModelEntries.forModel(this._model);
    this._pack = this._entry ? this._entry.basalt : null;
    this._family = this._pack ? this._pack.family : ModelFamilies.detect(this._model);
  }

  _resolveCard() {
    const devices = this._diagnostics && this._diagnostics.cuda && this._diagnostics.cuda.devices;
    const manifestCard = this._runtime.manifest && this._runtime.manifest.gpu;
    this._card = BasaltCard.pick(devices) || (manifestCard && manifestCard.index != null ? manifestCard : null);
    if (!this._card) throw new Error(BasaltCard.NO_CARD_REASON);
  }

  _resolveSlots() {
    const requested = Math.floor(Number(this._overrides.maxConcurrent));
    this._slots = Number.isFinite(requested) && requested >= 1 ? Math.min(BasaltLaunchPlanner.MAX_PARALLEL, requested) : 1;
  }

  _resolveKv() {
    this._kv = BasaltKvMode.resolve({ pack: this._pack, cacheType: this._overrides.cacheTypeK, slots: this._slots });
  }

  _sizeContext() {
    const addon = this._model.addon || {};
    const requested = Math.floor(Number(this._overrides.contextSize));
    this._requested = requested > 0 ? requested : (addon.defaultContextSize || (this._entry && this._entry.defaultContextSize) || BasaltLaunchPlanner.DEFAULT_CONTEXT);
    this._weights = Number(this._model.weightsTotalBytes) || 0;
    this._fit = BasaltContextSizer.fit({
      requested: this._requested,
      nativeCtx: addon.contextLength || (this._entry && this._entry.contextLength) || BasaltLaunchPlanner.DEFAULT_NATIVE_CTX,
      pack: this._pack,
      kv: this._kv.kv,
      slots: this._slots,
      vramBytes: this._card.vramBytes,
    });
  }

  _resolveVision() {
    this._visionAvailable = !!(this._pack && this._pack.vision);
    this._visionOn = this._visionAvailable && this._overrides.suppressMmprojLoad === false;
  }

  _resolveSleep() {
    const options = this._overrides.frameworkOptions || {};
    const seconds = Math.floor(Number(options.idleSleep));
    this._sleepSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    this._keepSleepRam = !!options.keepSleepRam;
    this._packCanSleep = this._platform !== 'win32' || !!(this._pack && this._pack.sizing === BasaltLaunchPlanner.SLEEP_SIZING_ON_WINDOWS);
  }

  get _sleepOn() {
    return this._sleepSeconds > 0 && this._packCanSleep;
  }

  get _apiModelName() {
    const id = (this._model.addon && this._model.addon.modelId) || (this._entry && this._entry.sidecar.modelId) || 'basalt';
    return String(id).replace(/[^A-Za-z0-9._-]/g, '-');
  }

  get _specOff() {
    return !!this._overrides.noSpecDrafter;
  }

  get _userPicksCards() {
    return this._userArgs.some((arg) => arg === '--gpu' || arg.startsWith('--gpu='));
  }

  _buildServeArgs() {
    this._serveArgs = [
      'serve', this._packPath,
      '--alias', this._apiModelName,
      '--host', BasaltLaunchPlanner.HOST,
      '--port', String(this._port),
      ...(this._userPicksCards ? [] : ['--gpu', String(this._card.index)]),
      '--max-context', String(this._fit.contextSize),
      '--parallel', String(this._slots),
    ];
    if (this._kv.kv) this._serveArgs.push('--kv', this._kv.kv);
    if (this._specOff) this._serveArgs.push('--spec', '0');
    if (this._visionOn) this._serveArgs.push('--vision', 'dynamic');
    if (this._sleepOn) this._serveArgs.push('--idle-sleep', String(this._sleepSeconds));
    if (this._sleepOn && this._keepSleepRam) this._serveArgs.push('--keep-sleep-ram');
    if (this._apiKey) this._serveArgs.push('--api-key', this._apiKey);
    this._serveArgs.push(...(Array.isArray(this._runtime.extraArgs) ? this._runtime.extraArgs : []), ...this._userArgs);
  }

  _familySampler() {
    const profile = ModelFamilies.launchArgs(this._family).profile;
    return profile && profile.samplerDefaults ? { ...profile.samplerDefaults } : null;
  }

  _notes() {
    const fmt = BasaltContextSizer.formatBytes;
    const { _runtime: runtime, _model: model, _card: card, _fit: fit, _kv: kv } = this;
    const notes = [...fit.notes];
    if (kv.note) notes.push(kv.note);
    notes.push(`Runtime: ${runtime.name || 'Basalt'} (native)${runtime.version ? ' @ ' + runtime.version : ''}.`);
    notes.push(`Model: ${model.name} · ${fmt(this._weights)} (${(model.addon && model.addon.quant) || 'Basalt pack'}).`);
    notes.push(`Context: ${fit.contextSize.toLocaleString()} tokens shared by ${this._slots} slot${this._slots === 1 ? '' : 's'}, KV ${kv.kv || 'engine default'}${this._kvSizeText()}; drafting ${this._specOff ? 'off' : 'on (the pack\'s drafter)'}.`);
    notes.push(this._gpuNote());
    notes.push(this._visionOn ? 'Vision: on (--vision dynamic, the projector inside the pack).' : 'Vision: off for this launch.');
    const sleep = this._sleepNote();
    if (sleep) notes.push(sleep);
    if (this._userArgs.length > 0) notes.push(`User flags appended: ${this._userArgs.join(' ')}.`);
    notes.push(this._apiKey ? 'Auth: --api-key set from API security.' : 'Auth: loopback server without an API key.');
    return notes;
  }

  _sleepNote() {
    if (this._sleepSeconds === 0) return null;
    if (!this._packCanSleep) return 'Sleep: off for this launch; on Windows only the dense pack can sleep.';
    const keep = this._keepSleepRam ? ', and the sleep memory stays held while awake (--keep-sleep-ram)' : '';
    return `Sleep: on after ${this._sleepSeconds} s idle (--idle-sleep ${this._sleepSeconds}): the VRAM moves to RAM until the next request${keep}.`;
  }

  _gpuNote() {
    const card = this._card;
    const described = `${card.index}${card.name ? ' (' + card.name + ')' : ''}${card.vramBytes ? ', ' + BasaltContextSizer.formatBytes(card.vramBytes) : ''}`;
    if (this._userPicksCards) return `GPU: the extra flags pick the cards; the context is sized for the main card, ${described}.`;
    return `GPU: --gpu ${described}; no other card is used.`;
  }

  _kvSizeText() {
    const perPosition = BasaltKvMode.bytesPerPosition(this._pack, this._kv.kv);
    return perPosition ? ` (~${BasaltContextSizer.formatBytes(perPosition * this._fit.contextSize)})` : '';
  }

  _buildPlan() {
    const { _fit: fit, _card: card } = this;
    return {
      contextSize: fit.contextSize,
      requestedContextSize: this._requested,
      mmprojPath: this._visionOn ? this._packPath : null,
      mmprojAvailable: this._visionAvailable,
      cacheTypeK: this._kv.kv, cacheTypeV: this._kv.kv,
      ngl: null,
      fullOffload: fit.fits,
      partial: null,
      gguf: null,
      singleGpu: String(card.index),
      flashAttn: true,
      swaFull: false,
      mtp: { enabled: !this._specOff, draftTokens: null },
      maxConcurrent: this._slots,
      maxConcurrentRequested: this._slots,
      ctxPerSlot: Math.floor(fit.contextSize / this._slots),
      apiKeyRequired: !!this._apiKey,
      skippedFlags: [],
      userArgs: this._userArgs.slice(),
      vramAvailableBytes: card.vramBytes || 0,
      modelEstimatedBytes: fit.estimatedBytes,
      perGpu: card.vramBytes ? [{ index: card.index, name: card.name, totalBytes: card.vramBytes }] : [],
      runtimeId: this._runtime.id,
      runtimeName: this._runtime.name,
      modelName: this._model.name,
      apiModelName: this._apiModelName,
      modelFamily: this._family || null,
      familySamplerDefaults: this._familySampler(),
      port: this._port,
      basalt: true,
      mode: 'native',
      distro: null,
      host: BasaltLaunchPlanner.HOST,
      processPattern: 'basalt',
      cudaDevice: card.index,
      notes: this._notes(),
    };
  }

  _wrapLaunch(plan) {
    return {
      binaryPath: this._runtime.binaryPath,
      args: this._serveArgs,
      plan,
      killTree: true,
      modelPath: this._packPath,
      authKey: this._apiKey,
      cudaDevice: null,
      healthTimeoutMs: LaunchFinalizer.healthTimeoutMs(this._weights),
    };
  }
}

module.exports = BasaltLaunchPlanner;
