const CudaPin = require('../../../shared/runtime/CudaPin');
const KvCacheModes = require('../../../shared/llm/KvCacheModes');
const ContextEstimator = require('../../ContextEstimator');
const LlmRuntimeServer = require('../LlmRuntimeServer');
const FitGenerationClient = require('./FitGenerationClient');
const DepthProbe = require('./DepthProbe');
const VramFootprint = require('./VramFootprint');
const CancellableDelay = require('./CancellableDelay');

class FitComboRunner {
  static SAMPLE_INTERVAL_MS = 700;
  static TEARDOWN_SETTLE_MS = 2500;
  static LOG_TAIL_LINES = 25;

  constructor({
    planFor,
    createSupervisor = () => new LlmRuntimeServer(),
    findFreePort = () => LlmRuntimeServer.findFreePort(),
    createFootprint = () => new VramFootprint(),
    client = new FitGenerationClient(),
    depthProbe = null,
    settleMs = FitComboRunner.TEARDOWN_SETTLE_MS,
  }) {
    this._planFor = planFor;
    this._createSupervisor = createSupervisor;
    this._findFreePort = findFreePort;
    this._createFootprint = createFootprint;
    this._client = client;
    this._depthProbe = depthProbe || new DepthProbe({ client });
    this._settleMs = settleMs;
  }

  static emptyRow({ contextTokens, kv }) {
    return {
      contextTokens,
      kv,
      status: 'error',
      ngl: null,
      fullOffload: null,
      vramBytes: null,
      vramApprox: false,
      ramBytes: null,
      tokensPerSec: null,
      promptTokensPerSec: null,
      completionTokens: null,
      tokensPerSecAtDepth: null,
      depthTokens: null,
      depthPrefillMs: null,
      depthPromptTokensPerSec: null,
      depthError: null,
      error: null,
      logsTail: null,
    };
  }

  async run(job) {
    const row = FitComboRunner.emptyRow(job.combo);
    let port;
    try {
      port = await this._findFreePort();
    } catch (err) {
      return { ...row, error: `No free port: ${err.message}` };
    }
    let launch;
    try {
      launch = this._planCombo(job, port);
    } catch (err) {
      return { ...row, error: `Plan failed: ${err.message}` };
    }
    row.ngl = launch.plan.ngl;
    row.fullOffload = launch.plan.fullOffload;
    return this._loadAndMeasure(job, port, launch, row);
  }

  static comboOverrides({ combo, priorFit }) {
    const kvPair = KvCacheModes.pair(combo.kv);
    const overrides = {
      contextSize: combo.contextTokens, cacheTypeK: kvPair.k, cacheTypeV: kvPair.v,
      forceFlashAttn: true, suppressMmprojLoad: true,
    };
    const priorMeasured = ContextEstimator.measuredComboVram(priorFit, combo.contextTokens, combo.kv);
    if (priorMeasured != null) overrides.measuredVramBytes = priorMeasured;
    return overrides;
  }

  _planCombo(job, port) {
    const overrides = FitComboRunner.comboOverrides(job);
    const cudaDevice = this._pickDevice(job, port, overrides);
    const diagnostics = cudaDevice ? CudaPin.filterDiagnosticsToDevices(job.diagnostics, cudaDevice) : job.diagnostics;
    const launch = this._plan(job, port, overrides, diagnostics);
    launch.authKey = job.apiKey || null;
    launch.cudaDevice = cudaDevice;
    return launch;
  }

  _pickDevice(job, port, overrides) {
    try {
      const probe = this._plan(job, port, overrides, job.diagnostics);
      const need = probe.plan && probe.plan.modelEstimatedBytes;
      if (job.resolveDevice && Number(need) > 0) return job.resolveDevice(Number(need)) || null;
    } catch (_) {}
    return null;
  }

  _plan(job, port, overrides, diagnostics) {
    return this._planFor.plan({
      model: job.model, runtime: job.runtime, runtimeCatalogEntry: job.catalogEntry,
      diagnostics, port, overrides, apiKey: job.apiKey,
    });
  }

  async _loadAndMeasure(job, port, launch, row) {
    const supervisor = this._createSupervisor();
    const footprint = this._createFootprint();
    await footprint.captureBaseline();
    const loadFailure = await this._load(supervisor, launch, job, row);
    if (loadFailure) return loadFailure;
    if (job.cancelled()) {
      await FitComboRunner._safeStop(supervisor);
      return { ...row, status: 'skipped', error: 'Canceled before generation.' };
    }
    footprint.track(supervisor.getStatus().pid);
    await footprint.sample();
    return this._generateAndMeasure(job, port, supervisor, footprint, row);
  }

  async _load(supervisor, launch, job, row) {
    try {
      await supervisor.start(launch, { shouldCancel: job.cancelled });
      return null;
    } catch (err) {
      const logsTail = FitComboRunner._tailLogs(supervisor);
      await FitComboRunner._safeStop(supervisor);
      if (job.cancelled()) return { ...row, status: 'skipped', error: 'Canceled while loading.' };
      return { ...row, status: 'error', error: `Load failed: ${err.message}`, logsTail };
    }
  }

  async _generateAndMeasure(job, port, supervisor, footprint, row) {
    footprint.startSampling(FitComboRunner.SAMPLE_INTERVAL_MS);
    let gen;
    try {
      gen = await this._client.generateAndTime(port, job.cancelled, job.apiKey);
    } catch (err) {
      footprint.stopSampling();
      return this._generationFailedRow(job, supervisor, footprint, row, err);
    }
    footprint.stopSampling();
    await footprint.sample();
    const depth = await this._measureDepth(job, port);
    const vram = footprint.resolve();
    await FitComboRunner._safeStop(supervisor);
    await CancellableDelay.until(this._settleMs, job.cancelled);
    return FitComboRunner._okRow(row, vram, footprint.ramBytes(), gen, depth);
  }

  async _generationFailedRow(job, supervisor, footprint, row, err) {
    const logsTail = FitComboRunner._tailLogs(supervisor);
    const vram = footprint.resolve();
    await FitComboRunner._safeStop(supervisor);
    const canceled = job.cancelled();
    return {
      ...row,
      status: canceled ? 'skipped' : 'error',
      error: canceled ? 'Canceled during generation.' : `Generation failed: ${err.message}`,
      vramBytes: vram.vramBytes,
      vramApprox: vram.vramApprox,
      ramBytes: footprint.ramBytes(),
      logsTail,
    };
  }

  async _measureDepth(job, port) {
    if (!job.combo.depthProbe || job.cancelled()) return null;
    try {
      return await this._depthProbe.measure(port, job.combo.contextTokens, job.cancelled, job.apiKey);
    } catch (err) {
      return { error: job.cancelled() ? 'Canceled during the depth probe.' : `Depth probe failed: ${err.message}` };
    }
  }

  static _okRow(row, vram, ramBytes, gen, depth) {
    const pick = (key) => (depth && depth[key] != null ? depth[key] : null);
    return {
      ...row,
      status: 'ok',
      vramBytes: vram.vramBytes,
      vramApprox: vram.vramApprox,
      ramBytes,
      tokensPerSec: gen.tokensPerSec,
      promptTokensPerSec: gen.promptTokensPerSec,
      completionTokens: gen.completionTokens,
      tokensPerSecAtDepth: pick('tokensPerSec'),
      depthTokens: pick('promptTokens'),
      depthPrefillMs: pick('prefillMs'),
      depthPromptTokensPerSec: pick('promptTokensPerSec'),
      depthError: depth && depth.error ? depth.error : null,
      error: null,
      logsTail: null,
    };
  }

  static _tailLogs(supervisor) {
    try {
      const logs = supervisor.getStatus().logs || [];
      return logs.slice(-FitComboRunner.LOG_TAIL_LINES).map((e) => e.line).join('\n') || null;
    } catch (_) {
      return null;
    }
  }

  static async _safeStop(supervisor) {
    try { await supervisor.stop(); } catch (_) {}
  }
}

module.exports = FitComboRunner;
