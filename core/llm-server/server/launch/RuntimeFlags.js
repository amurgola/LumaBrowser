const LlamaBuildNumber = require('../../../shared/runtime/detect/LlamaBuildNumber');

class RuntimeFlags {
  static TENSOR_SPLIT_MIN_BUILD = 9000;

  static LOAD_MODE_MIN_BUILD = 10105;

  static FIT_OFF_MIN_BUILD = 10621;

  static LUMA_RUNTIME_ID = 'llama-cpp-luma';

  static TENSOR_SPLIT_RUNTIME_IDS = ['llama-cpp-cuda12', 'llama-cpp-cuda13', 'llama-cpp-luma'];

  constructor(runtime) {
    this.id = runtime.id;
    this.name = runtime.name;
    this.binaryPath = runtime.binaryPath;
    this.unsupported = new Set(Array.isArray(runtime.unsupportedFlags) ? runtime.unsupportedFlags : []);
    this.skipFeatures = new Set(Array.isArray(runtime.skipFeatures) ? runtime.skipFeatures : []);
    this.extraArgs = Array.isArray(runtime.extraArgs) ? runtime.extraArgs.slice() : [];
    this.specDialect = runtime.specDialect === 'ik' ? 'ik' : 'mainline';
    this.build = LlamaBuildNumber.parse(runtime.version);
    this.isLuma = runtime.id === RuntimeFlags.LUMA_RUNTIME_ID;
    this._resolveFeatureFlags();
    this._resolveSpeculationFlags();
    this._resolveBuildGates();
  }

  accepts(flag) {
    return !this.unsupported.has(flag);
  }

  _resolveFeatureFlags() {
    this.flashAttn = this.accepts('--flash-attn');
    this.swaFull = this.accepts('--swa-full');
    this.contextShift = this.accepts('--no-context-shift');
    this.parallel = this.accepts('--parallel');
    this.cacheReuse = this.accepts('--cache-reuse');
    this.cacheRam = this.accepts('--cache-ram');
    this.slotSimilarity = this.accepts('--slot-prompt-similarity');
    this.rpc = this.accepts('--rpc');
    this.cpuMoe = this.accepts('--cpu-moe');
    this.splitMode = this.accepts('--split-mode');
    this.tensorSplit = this.accepts('--tensor-split');
    this.fit = this.accepts('--fit');
    this.noMmap = this.accepts('--no-mmap');
  }

  _resolveSpeculationFlags() {
    this.mtpFlags = this.accepts('--spec-type') && (this.specDialect === 'ik' || this.accepts('--spec-draft-n-max'));
    this.specDrafterFlags = this.mtpFlags && this.accepts('--model-draft') && this.accepts('-md');
    this.draftCacheFlags = this.accepts('--cache-type-k-draft') && this.accepts('--cache-type-v-draft');
    this.specType = this.accepts('--spec-type');
  }

  _resolveBuildGates() {
    const build = Number(this.build);
    this.loadMode = this.accepts('--load-mode')
      && (this.isLuma || build >= RuntimeFlags.LOAD_MODE_MIN_BUILD || this.unsupported.has('--no-mmap'));
    this.fitOff = this.fit && (this.isLuma || build >= RuntimeFlags.FIT_OFF_MIN_BUILD);
    this.tensorSplitRuntime = RuntimeFlags.TENSOR_SPLIT_RUNTIME_IDS.includes(this.id);
    this.tensorSplitBuild = this.isLuma || build >= RuntimeFlags.TENSOR_SPLIT_MIN_BUILD;
  }
}

module.exports = RuntimeFlags;
