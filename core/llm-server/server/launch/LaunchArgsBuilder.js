const KvCacheType = require('./KvCacheType');
const SlotPlan = require('./SlotPlan');
const SpeculationPlan = require('./SpeculationPlan');
const PromptCacheRam = require('./PromptCacheRam');

class LaunchArgsBuilder {
  static HOST = '127.0.0.1';

  static build(state) {
    return new LaunchArgsBuilder(state).execute();
  }

  constructor(state) {
    this._s = state;
    this._args = [];
  }

  execute() {
    this._addPlacement();
    this._addLoading();
    this._addServing();
    this._addSpeculation();
    this._addSplits();
    this._addTuning();
    return this._args;
  }

  _push(...values) {
    for (const v of values) this._args.push(v);
  }

  _addPlacement() {
    const { files, kv, offload, port } = this._s;
    this._push('-m', files.modelPath, '-c', String(kv.contextSize), '-ngl', String(offload.ngl),
      '--host', LaunchArgsBuilder.HOST, '--port', String(port));
  }

  _addLoading() {
    const { loading, flags, apiKey } = this._s;
    this._push(...loading.loadModeArgs);
    if (flags.fitOff) this._push('--fit', 'off');
    if (apiKey) this._push('--api-key', apiKey);
  }

  _addServing() {
    this._addAttentionAndCache();
    this._addSlots();
    this._addPromptCache();
  }

  _addAttentionAndCache() {
    const { flags, vision, kv } = this._s;
    if (flags.flashAttn) this._push('--flash-attn', 'on');
    if (vision.effectiveMmprojPath) this._push('--mmproj', vision.effectiveMmprojPath);
    if (flags.flashAttn && KvCacheType.isQuantized(kv.cacheTypeK)) this._push('--cache-type-k', kv.cacheTypeK);
    if (flags.flashAttn && KvCacheType.isQuantized(kv.cacheTypeV)) this._push('--cache-type-v', kv.cacheTypeV);
    if (kv.kvOnHost) this._push('--no-kv-offload');
  }

  _addSlots() {
    const { flags, slots, offload } = this._s;
    if (flags.parallel) this._push('--parallel', String(slots.maxConcurrent));
    if (offload.swaFull) this._push('--swa-full');
    if (flags.contextShift) this._push('--no-context-shift');
    if (slots.cacheReuseEnabled) this._push('--cache-reuse', String(SlotPlan.CACHE_REUSE_MIN_CHUNK));
  }

  _addPromptCache() {
    const { loading } = this._s;
    if (loading.promptCacheRam.mib != null) this._push('--cache-ram', String(loading.promptCacheRam.mib));
    if (loading.slotSimilarityEnabled) this._push('--slot-prompt-similarity', String(PromptCacheRam.SLOT_PROMPT_SIMILARITY));
  }

  _addSpeculation() {
    const { spec, flags, files, offload } = this._s;
    if (spec.mtpEnabled && flags.specDialect === 'ik') {
      this._push('--spec-type', `mtp:n_max=${spec.mtpDraftNMax}`);
    } else if (spec.mtpEnabled) {
      this._push('--spec-type', 'draft-mtp,ngram-mod', '--spec-draft-n-max', String(spec.mtpDraftNMax));
      if (spec.mtpDetached) this._pushDetachedHead(files.mtpHeadPath, offload.ngl);
      this._push('--spec-ngram-mod-n-match', String(SpeculationPlan.NGRAM_MOD_N_MATCH),
        '--spec-ngram-mod-n-min', String(SpeculationPlan.NGRAM_MOD_N_MIN),
        '--spec-ngram-mod-n-max', String(SpeculationPlan.NGRAM_MOD_N_MAX));
    } else if (spec.ngramSpecEnabled) {
      this._push('--spec-type', 'ngram-mod', '--spec-ngram-mod-n-max', String(SpeculationPlan.NGRAM_SOLO_N_MAX));
    }
    if (spec.draftCacheType) this._push('--cache-type-k-draft', spec.draftCacheType, '--cache-type-v-draft', spec.draftCacheType);
  }

  _pushDetachedHead(headPath, ngl) {
    this._push('-md', headPath);
    if (ngl > 0) this._push('-ngld', '99');
  }

  _addSplits() {
    const { splits, budget, moe } = this._s;
    if (splits.emitTensorSplit) {
      this._push('--split-mode', 'tensor');
      if (splits.tensorSplitRatio) this._push('--tensor-split', splits.tensorSplitRatio);
    }
    if (budget.rpcEnabled) {
      this._push('--rpc', budget.rpcServers.map((s) => s.addr).join(','));
      if (splits.rpcSplitRatio) this._push('--tensor-split', splits.rpcSplitRatio);
    }
    if (moe.cpuMoeEnabled) this._addExpertOffload(moe);
    if (splits.layerFill) this._push('--tensor-split', splits.layerFill.ratio);
  }

  _addExpertOffload(moe) {
    if (moe.gpuExpertLayers <= 0) {
      this._push('--cpu-moe');
      return;
    }
    this._push('--n-cpu-moe', String(moe.nCpuMoe));
    if (moe.tensorSplitRatio) this._push('--tensor-split', moe.tensorSplitRatio);
  }

  _addTuning() {
    const { family, flags, userArgs } = this._s;
    this._push(...family.tuning.args);
    if (family.drafterSpec) this._push(...family.drafterSpec.args);
    this._push(...flags.extraArgs);
    this._push(...userArgs);
  }
}

module.exports = LaunchArgsBuilder;
