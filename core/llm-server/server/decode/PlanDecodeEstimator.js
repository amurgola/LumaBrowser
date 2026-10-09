const MemoryBandwidth = require('../../MemoryBandwidth');
const DecodeFormula = require('./DecodeFormula');
const GpuLayerAssignment = require('./GpuLayerAssignment');

class PlanDecodeEstimator {
  static RECURRENT_STATE_BYTES_PER_BLOCK = 2 * 1024 * 1024;

  static DEFAULT_EXPERTS_USED = 4;

  static SAMPLE_DEPTHS = [8192, 32768];

  static estimate(input) {
    try {
      return new PlanDecodeEstimator(input).execute();
    } catch (_) {
      return null;
    }
  }

  constructor(input) {
    this._input = input || {};
  }

  execute() {
    if (!this._readModelFacts()) return null;
    this._resolveExperts();
    this._resolvePlacement();
    this._createDomains();
    this._chargeBlocks();
    this._resolveStepCosts();
    return this._result();
  }

  _readModelFacts() {
    const { gguf, modelBytes, contextSize, perGpu, kvAtLayer } = this._input;
    this._gguf = gguf;
    this._blocks = Number(gguf && gguf.blockCount) || 0;
    this._bytes = Number(modelBytes) || 0;
    this._contextTokens = Math.max(1, Math.floor(Number(contextSize) || 0)) || 1;
    this._gpus = Array.isArray(perGpu) ? perGpu : [];
    return !!this._blocks && this._bytes > 0 && typeof kvAtLayer === 'function';
  }

  _resolveExperts() {
    const { moeSplit } = this._input;
    const experts = Number(this._gguf.expertCount) || 0;
    this._isMoe = experts > 1 && !!moeSplit;
    const expertsUsed = this._isMoe ? (Number(this._gguf.expertUsedCount) || PlanDecodeEstimator.DEFAULT_EXPERTS_USED) : 0;
    this._activeFraction = this._isMoe ? Math.min(1, expertsUsed / experts) : 1;
    this._expertAt = this._isMoe ? PlanDecodeEstimator._expertBytesAccessor(moeSplit, this._blocks) : () => 0;
    let expertTotal = 0;
    for (let i = 0; i < this._blocks; i++) expertTotal += this._expertAt(i);
    const hostBytes = this._isMoe ? Math.max(0, Number(moeSplit.hostBytes) || 0) : 0;
    this._densePerLayer = Math.max(0, this._bytes - expertTotal - hostBytes) / this._blocks;
  }

  _resolvePlacement() {
    const { cpuMoe, layerFill } = this._input;
    const firstGpuLayer = this._blocks - this._layersOnGpu();
    this._owner = GpuLayerAssignment.assign({
      firstGpuLayer, blocks: this._blocks, perGpu: this._gpus, layerFill, cpuMoeSplit: cpuMoe && cpuMoe.tensorSplit,
    });
  }

  _layersOnGpu() {
    const { fullOffload, partial, ngl } = this._input;
    if (fullOffload) return this._blocks;
    if (partial && partial.ngl > 0) return Math.min(this._blocks, partial.ngl);
    return Math.min(this._blocks, Math.max(0, Math.floor(Number(ngl) || 0)));
  }

  _createDomains() {
    this._gpuDomains = this._gpus.map((gpu, index) => PlanDecodeEstimator._domain(
      gpu && gpu.name ? String(gpu.name) : `GPU ${index}`, 'gpu', !!(gpu && gpu.remote), MemoryBandwidth.resolveGpuBandwidth(gpu),
    ));
    const diagnostics = this._input.diagnostics;
    this._cpuDomain = PlanDecodeEstimator._domain('System RAM', 'cpu', false, MemoryBandwidth.resolveRamBandwidth(diagnostics && diagnostics.memory));
  }

  _chargeBlocks() {
    const { hasKvAt, kvOnHost } = this._input;
    this._hybridBlocks = 0;
    for (let i = 0; i < this._blocks; i++) {
      const home = this._domainOf(i);
      const recurrent = typeof hasKvAt === 'function' && !hasKvAt(i);
      if (recurrent) this._hybridBlocks += 1;
      home.weightBytesPerToken += this._densePerLayer + (recurrent ? PlanDecodeEstimator.RECURRENT_STATE_BYTES_PER_BLOCK : 0);
      if (this._isMoe) (this._expertsOnCpuAt(i) ? this._cpuDomain : home).weightBytesPerToken += Math.ceil(this._expertAt(i) * this._activeFraction);
      if (!recurrent) (kvOnHost ? this._cpuDomain : home).historyLayers.push(i);
    }
  }

  _domainOf(block) {
    const owner = this._owner[block];
    return (owner >= 0 && this._gpuDomains[owner]) ? this._gpuDomains[owner] : this._cpuDomain;
  }

  _expertsOnCpuAt(block) {
    const { cpuMoe } = this._input;
    if (!cpuMoe) return this._owner[block] < 0;
    if (cpuMoe.nCpuMoe == null) return true;
    return block < cpuMoe.nCpuMoe || this._owner[block] < 0;
  }

  _resolveStepCosts() {
    const used = [...this._gpuDomains, this._cpuDomain].filter((d) => d.weightBytesPerToken > 0 || d.historyLayers.length > 0);
    this._cpuExecutes = this._cpuDomain.weightBytesPerToken > 0;
    this._remoteCount = used.filter((d) => d.remote).length;
    const baseMs = (this._cpuExecutes || this._gpus.length === 0) ? DecodeFormula.CPU_STEP_MS : DecodeFormula.GPU_STEP_MS;
    this._fixedMs = baseMs + this._remoteCount * DecodeFormula.RPC_HOP_MS;
    this._parallel = !!this._input.tensorSplit && used.filter((d) => d.kind === 'gpu').length > 1;
    this._syncMs = this._parallel ? this._blocks * DecodeFormula.TENSOR_SPLIT_LAYER_SYNC_MS : 0;
    this._resolved = used.map((d) => this._withHistoryReader(d));
  }

  _withHistoryReader(domain) {
    const { kvAtLayer } = this._input;
    return {
      ...domain,
      historyBytesPerToken: (depth) => domain.historyLayers.reduce((sum, i) => sum + Math.max(0, Number(kvAtLayer(i, depth)) || 0), 0),
    };
  }

  _tpsAt(depth) {
    return DecodeFormula.estimateTps({
      domains: this._resolved, fixedMs: this._fixedMs, depth: Math.min(depth, this._contextTokens), parallel: this._parallel, syncMs: this._syncMs,
    });
  }

  _result() {
    const depths = [...PlanDecodeEstimator.SAMPLE_DEPTHS.filter((d) => d < this._contextTokens), this._contextTokens];
    return {
      at8k: this._tpsAt(8192),
      at32k: this._tpsAt(32768),
      atFull: this._tpsAt(this._contextTokens),
      fullTokens: this._contextTokens,
      samples: depths.map((depth) => ({ depth, tps: this._tpsAt(depth) })),
      fixedMs: this._fixedMs,
      source: DecodeFormula.bandwidthSourceOf(this._resolved),
      confidence: this._confidence(),
      speculative: 'excluded',
      domains: this._resolved.map((d) => this._domainSummary(d)),
    };
  }

  _confidence() {
    const anyFloor = this._resolved.some((d) => d.bandwidthSource === 'floor');
    if (anyFloor || (this._isMoe && !Number(this._gguf.expertUsedCount))) return 'low';
    const approximated = this._isMoe || this._hybridBlocks > 0 || this._cpuExecutes || this._parallel || this._remoteCount > 0;
    return approximated ? 'moderate' : 'high';
  }

  _domainSummary(domain) {
    return {
      name: domain.name,
      kind: domain.kind,
      remote: domain.remote,
      weightBytesPerToken: Math.round(domain.weightBytesPerToken),
      historyBytesPerTokenAtFull: Math.round(domain.historyBytesPerToken(this._contextTokens)),
      bandwidthGbps: domain.bandwidthGbps,
      bandwidthSource: domain.bandwidthSource,
    };
  }

  static _domain(name, kind, remote, bandwidth) {
    return { name, kind, remote, weightBytesPerToken: 0, historyLayers: [], bandwidthGbps: bandwidth.gbps, bandwidthSource: bandwidth.source };
  }

  static _expertBytesAccessor(moeSplit, blocks) {
    if (Array.isArray(moeSplit.expertBytesPerBlock) && moeSplit.expertBytesPerBlock.length === blocks) {
      return (i) => Math.max(0, Number(moeSplit.expertBytesPerBlock[i]) || 0);
    }
    const even = Math.max(0, Number(moeSplit.expertBytes) || 0) / blocks;
    return () => even;
  }
}

module.exports = PlanDecodeEstimator;
