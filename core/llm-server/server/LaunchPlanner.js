const MediaLaunchPlanner = require('../../media-shared/MediaLaunchPlanner');
const UserArgs = require('./UserArgs');
const PlanDecodeEstimator = require('./decode/PlanDecodeEstimator');
const ModelFiles = require('./launch/ModelFiles');
const RuntimeFlags = require('./launch/RuntimeFlags');
const KvSettings = require('./launch/KvSettings');
const SlotPlan = require('./launch/SlotPlan');
const SpeculationPlan = require('./launch/SpeculationPlan');
const VisionProjectorPlan = require('./launch/VisionProjectorPlan');
const VramBudget = require('./launch/VramBudget');
const TensorParallelGate = require('./launch/TensorParallelGate');
const MoeExpertPlan = require('./launch/MoeExpertPlan');
const OffloadDecision = require('./launch/OffloadDecision');
const SplitPlan = require('./launch/SplitPlan');
const LoadingPolicy = require('./launch/LoadingPolicy');
const FamilyTuning = require('./launch/FamilyTuning');
const LaunchArgsBuilder = require('./launch/LaunchArgsBuilder');
const KvCacheSizer = require('./launch/KvCacheSizer');
const HybridAttentionLayout = require('./launch/HybridAttentionLayout');
const PlacementNotes = require('./launch/PlacementNotes');
const ModelFeatureNotes = require('./launch/ModelFeatureNotes');
const ServingNotes = require('./launch/ServingNotes');
const PlanSummary = require('./launch/PlanSummary');
const PromptCacheRam = require('./launch/PromptCacheRam');

class LaunchPlanner extends MediaLaunchPlanner {
  static DEFAULT_CONTEXT = KvSettings.DEFAULT_CONTEXT;

  static PROMPT_CACHE_RAM_SETTING_KEY = PromptCacheRam.SETTING_KEY;

  plan(options) {
    const { binaryPath, args, plan } = super.plan(options);
    return { binaryPath, modelPath: this._s.files.modelPath, mmprojPath: this._s.files.mmprojPath, args, plan };
  }

  _validate() {
    this._requireOption('model');
    this._requireOption('runtime');
    const { model, runtime, port } = this._options;
    if (!runtime.binaryPath) throw new Error('LaunchPlanner: runtime has no binaryPath');
    if (!Array.isArray(model.weights) || model.weights.length === 0) throw new Error('LaunchPlanner: model has no weight files');
    if (!port || typeof port !== 'number') throw new Error('LaunchPlanner: port is required');
  }

  _resolveSettings() {
    this._readInputs();
    this._resolveModelSettings();
    this._resolveBudget();
    this._resolvePlacement();
    this._resolveServing();
  }

  _buildArgs() {
    return LaunchArgsBuilder.build(this._s);
  }

  _resolveBinaryPath() {
    return this._s.flags.binaryPath;
  }

  _describePlan() {
    const s = this._s;
    s.decodeEstimate = this._estimateDecode();
    s.notes = [...PlacementNotes.build(s), ...ModelFeatureNotes.build(s), ...ServingNotes.build(s)];
    return PlanSummary.build(s);
  }

  _readInputs() {
    const { model, runtime, diagnostics, port, overrides, apiKey, userArgs } = this._options;
    this._s = {
      model,
      diagnostics,
      port,
      overrides: overrides || {},
      apiKey: (typeof apiKey === 'string' && apiKey.length > 0) ? apiKey : null,
      userArgs: UserArgs.normalize(userArgs),
      files: new ModelFiles(model),
      flags: new RuntimeFlags(runtime),
    };
  }

  _resolveModelSettings() {
    const s = this._s;
    s.kv = new KvSettings({ overrides: s.overrides, gguf: s.files.gguf, family: s.files.family });
    s.slots = SlotPlan.resolve(s);
    s.spec = SpeculationPlan.resolve(s);
    s.vision = VisionProjectorPlan.resolve(s);
  }

  _resolveBudget() {
    const s = this._s;
    s.budget = VramBudget.resolve(s);
    s.tensorGate = TensorParallelGate.resolve({
      overrides: s.overrides, flags: s.flags, gguf: s.files.gguf,
      rpcEnabled: s.budget.rpcEnabled, gpuCount: s.budget.perGpu.length,
    });
    if (s.tensorGate.staticOk) s.kv.forceF16();
  }

  _resolvePlacement() {
    const s = this._s;
    s.moe = MoeExpertPlan.resolve(s);
    s.offload = OffloadDecision.resolve(s);
    s.splits = SplitPlan.resolve(s);
  }

  _resolveServing() {
    const s = this._s;
    s.loading = LoadingPolicy.resolve(s);
    s.family = FamilyTuning.resolve(s);
    s.skippedFlags = [
      ...(s.flags.flashAttn ? [] : ['--flash-attn']),
      ...(s.offload.fullOffload && s.offload.swaLayout && !s.flags.swaFull ? ['--swa-full'] : []),
    ];
  }

  _estimateDecode() {
    const { files, moe, budget, offload, splits, kv, diagnostics } = this._s;
    const gguf = files.gguf;
    if (!gguf) return null;
    const hybrid = HybridAttentionLayout.of(gguf);
    return PlanDecodeEstimator.estimate({
      gguf, modelBytes: files.modelBytes, moeSplit: moe.moeSplit,
      cpuMoe: moe.cpuMoeEnabled ? { nCpuMoe: moe.gpuExpertLayers > 0 ? moe.nCpuMoe : null, tensorSplit: moe.tensorSplitRatio } : null,
      perGpu: budget.perGpu, fullOffload: offload.fullOffload, ngl: offload.ngl, partial: offload.partial,
      layerFill: splits.layerFill, tensorSplit: splits.emitTensorSplit,
      contextSize: kv.contextSize, kvOnHost: kv.kvOnHost, diagnostics,
      kvAtLayer: (i, depth) => KvCacheSizer.atLayer(gguf, i, depth, kv.cacheTypeK, kv.cacheTypeV, false),
      hasKvAt: hybrid ? hybrid.hasKvAt : null,
    });
  }
}

module.exports = LaunchPlanner;
