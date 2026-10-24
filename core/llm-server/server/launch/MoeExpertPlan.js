const MoeEstimator = require('../../models/MoeEstimator');
const FullOffloadCost = require('./FullOffloadCost');
const LaunchCostInput = require('./LaunchCostInput');
const MoeLayerSplit = require('./MoeLayerSplit');
const MoeGpuCachePlan = require('./MoeGpuCachePlan');

class MoeExpertPlan {
  static FILL_SAFETY = 0.85;

  static FILL_SAFETY_EXACT = 0.93;

  static resolve(state) {
    return new MoeExpertPlan(state).execute();
  }

  constructor(state) {
    this._state = state;
    this._files = state.files;
    this._gguf = state.files.gguf;
  }

  execute() {
    this._readSplit();
    this._resolveEngagement();
    if (this.cpuMoeEnabled) this._fillSpareVram();
    this._balanceAcrossCards();
    this._resolveBudgetWeights();
    this._resolveCpuPool();
    return this;
  }

  expertBytesRange(from, to) {
    let sum = 0;
    for (let i = from; i < to; i++) sum += this.expertBytesAt(i);
    return sum;
  }

  _readSplit() {
    this.cpuMoeRequested = !!this._state.overrides.cpuMoe;
    this.cpuMoeFlagSupported = this._state.flags.cpuMoe;
    this.moeSplit = this._gguf ? MoeEstimator.estimateSplit(this._gguf, this._files.modelBytes) : null;
    this.moeHostBytes = this.moeSplit ? Math.max(0, Number(this.moeSplit.hostBytes) || 0) : 0;
    this.moeExact = !!(this.moeSplit && this.moeSplit.exact && Array.isArray(this.moeSplit.expertBytesPerBlock));
    this.expertBytesAt = () => 0;
    this.residentBytesAt = () => 0;
    this.nCpuMoe = 0;
    this.gpuExpertLayers = 0;
    this.gpuCache = { enabled: false, bytes: 0, mib: 0, reason: null };
    this.stagingBytes = 0;
  }

  _resolveEngagement() {
    const { overrides, budget } = this._state;
    this.fullWeightsEstimatedBytes = this._fullWeightsPrice();
    this.cpuMoeAuto = !this.cpuMoeRequested && !overrides.noAutoCpuMoe && !!this.moeSplit
      && this.cpuMoeFlagSupported && budget.totalVram > 0
      && this.fullWeightsEstimatedBytes > budget.vramAvailableBytes;
    this.cpuMoeEnabled = (this.cpuMoeRequested || this.cpuMoeAuto) && this.cpuMoeFlagSupported && !!this.moeSplit;
  }

  _fullWeightsPrice() {
    if (!this._gguf) return FullOffloadCost.noHeaderBytes(LaunchCostInput.noHeader(this._state));
    return FullOffloadCost.bytes(LaunchCostInput.build(this._state, this._files.modelBytes - this.moeHostBytes, false));
  }

  _fillSpareVram() {
    const blocks = this._gguf.blockCount;
    this._resolvePerLayerBytes(blocks);
    const fillBudget = this._fillBudget();
    this.gpuExpertLayers = this._tailLayersThatFit(fillBudget, blocks);
    this.nCpuMoe = blocks - this.gpuExpertLayers;
    if (this.nCpuMoe <= 0) {
      this.cpuMoeEnabled = false;
      this.gpuExpertLayers = 0;
      this.nCpuMoe = 0;
      return;
    }
    this._resolveGpuCache(fillBudget, blocks);
  }

  _resolveGpuCache(fillBudget, blocks) {
    const { overrides, flags, budget } = this._state;
    this.gpuCache = MoeGpuCachePlan.resolve({
      overrides, flags, budget, gguf: this._gguf, fillBudget,
      expertBytes: this.moeSplit.expertBytes,
      cpuExpertBytes: this.expertBytesRange(0, this.nCpuMoe),
      maxExpertSliceBytes: this._maxExpertSliceBytes(blocks),
    });
    if (!this.gpuCache.enabled) return;
    this.gpuExpertLayers = 0;
    this.nCpuMoe = blocks;
  }

  _maxExpertSliceBytes(blocks) {
    const experts = Number(this._gguf.expertCount) || 0;
    return experts > 0 ? this._maxLayerExpertBytes(blocks) / experts : 0;
  }

  _resolvePerLayerBytes(blocks) {
    const split = this.moeSplit;
    this.perLayerExpertBytes = split.expertBytes / blocks;
    this.expertBytesAt = this.moeExact
      ? (i) => Math.max(0, Number(split.expertBytesPerBlock[i]) || 0)
      : () => this.perLayerExpertBytes;
    const layout = this._gguf.tensorLayout;
    const residentPerBlock = this.moeExact && layout && Array.isArray(layout.residentBytesPerBlock)
      && layout.residentBytesPerBlock.length === blocks ? layout.residentBytesPerBlock : null;
    const residentSpread = residentPerBlock
      ? Math.max(0, split.residentBytes - residentPerBlock.reduce((sum, v) => sum + (Number(v) || 0), 0)) / blocks
      : split.residentBytes / blocks;
    this.residentBytesAt = residentPerBlock
      ? (i) => (Number(residentPerBlock[i]) || 0) + residentSpread
      : () => residentSpread;
  }

  _fillBudget() {
    const residentFull = FullOffloadCost.bytes(LaunchCostInput.build(this._state, this.moeSplit.residentBytes, false));
    this.stagingBytes = this._maxLayerExpertBytes(this._gguf.blockCount);
    const spare = this._state.budget.vramAvailableBytes - residentFull - this.stagingBytes;
    return spare > 0 ? spare * (this.moeExact ? MoeExpertPlan.FILL_SAFETY_EXACT : MoeExpertPlan.FILL_SAFETY) : 0;
  }

  _maxLayerExpertBytes(blocks) {
    let max = 0;
    for (let i = 0; i < blocks; i++) max = Math.max(max, this.expertBytesAt(i));
    return max;
  }

  _tailLayersThatFit(fillBudget, blocks) {
    let layers = 0;
    if (!(fillBudget > 0 && this.moeSplit.expertBytes > 0)) return layers;
    let gpuExpertBytes = 0;
    for (let i = blocks - 1; i >= 0; i--) {
      const layerBytes = this.expertBytesAt(i);
      if (gpuExpertBytes + layerBytes > fillBudget) break;
      gpuExpertBytes += layerBytes;
      layers++;
    }
    return layers;
  }

  _balanceAcrossCards() {
    this.tensorSplitRatio = null;
    const { budget, overrides, kv } = this._state;
    if (!(this.cpuMoeEnabled && this.gpuExpertLayers > 0 && !budget.rpcEnabled && budget.perGpu.length >= 2
      && !overrides.manualTensorSplitActive)) return;
    const balanced = MoeLayerSplit.balance({
      perGpu: budget.perGpu, gguf: this._gguf, contextSize: kv.contextSize,
      cacheTypeK: kv.cacheTypeK, cacheTypeV: kv.cacheTypeV, kvOnHost: kv.kvOnHost,
      expertBytesAt: this.expertBytesAt, residentBytesAt: this.residentBytesAt, nCpuMoe: this.nCpuMoe,
    });
    if (!balanced) return;
    this.tensorSplitRatio = balanced.ratio;
    if (balanced.nCpuMoe > this.nCpuMoe) {
      this.nCpuMoe = balanced.nCpuMoe;
      this.gpuExpertLayers = this._gguf.blockCount - this.nCpuMoe;
    }
  }

  _resolveBudgetWeights() {
    const modelBytes = this._files.modelBytes;
    if (!this.cpuMoeEnabled) {
      this.budgetWeightsBytes = modelBytes;
      return;
    }
    const gpuExperts = this.gpuCache.enabled ? this.gpuCache.bytes : this.expertBytesRange(this.nCpuMoe, this._gguf.blockCount);
    this.budgetWeightsBytes = Math.min(modelBytes, Math.round(this.moeSplit.residentBytes + gpuExperts));
  }

  _resolveCpuPool() {
    this.cpuExpertBytes = this.cpuMoeEnabled ? Math.round(this.expertBytesRange(0, this.nCpuMoe)) : 0;
    this.cpuPoolBytes = this.cpuExpertBytes + (this.cpuMoeEnabled ? this.moeHostBytes : 0);
  }
}

module.exports = MoeExpertPlan;
