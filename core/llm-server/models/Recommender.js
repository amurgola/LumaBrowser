const CuratedModelCatalog = require('./CuratedModelCatalog');
const FitVramMath = require('./FitVramMath');
const RecommenderRuntimePicker = require('./RecommenderRuntimePicker');
const RecommenderRationale = require('./RecommenderRationale');
const CatalogDecodeEstimator = require('../server/decode/CatalogDecodeEstimator');

class Recommender {
  static CTX_TARGET = { short: 4096, medium: 16384, long: 49152 };

  static KV_RESERVE_CTX = 32768;

  static MIN_CONTEXT = 4096;

  static MIN_GPU_BYTES = 1.5 * FitVramMath.GB;

  static FALLBACK_RAM_BYTES = 8 * FitVramMath.GB;

  static recommend(hw, answers) {
    return new Recommender(hw, answers).execute();
  }

  constructor(hw, answers) {
    this._hw = hw;
    this._answers = answers;
  }

  execute() {
    this._readInputs();
    this._resolvePool();
    this._pickModel();
    this._resolveContext();
    return this._createRecommendation();
  }

  _readInputs() {
    const hw = this._hw;
    const answers = this._answers;
    this._usableVram = Math.max(0, Number(hw && hw.usableVramBytes) || 0);
    this._usableRam = Math.max(0, Number(hw && hw.usableRamBytes) || 0);
    this._useCase = answers && answers.useCase || 'chat';
    this._tkPref = Number(answers && answers.tkPref) || 20;
    this._ctxPref = (answers && answers.ctxPref) || 'medium';
    this._runtimeId = RecommenderRuntimePicker.pick(hw);
    this._gpu = this._usableVram > Recommender.MIN_GPU_BYTES;
    this._speed = this._tkPref >= 50 ? 'fast' : this._tkPref >= 20 ? 'balanced' : 'patient';
  }

  _resolvePool() {
    let pool = CuratedModelCatalog.MODELS.filter((m) => m.useCases.includes(this._useCase));
    if (!pool.length) pool = CuratedModelCatalog.MODELS.slice();
    this._pool = pool.slice().sort((a, b) => {
      if (this._useCase === 'development') {
        const ac = a.id.includes('coder') ? 1 : 0;
        const bc = b.id.includes('coder') ? 1 : 0;
        if (ac !== bc) return bc - ac;
      }
      return b.paramsB - a.paramsB;
    });
  }

  _pickModel() {
    this._pick = (this._gpu && this._pickFullGpuFit())
      || (this._speed !== 'fast' && this._pickRamFit())
      || this._pickSmallest();
  }

  _pickFullGpuFit() {
    let firstFit = null;
    for (const m of this._pool) {
      const q = this._bestQuantForVram(m);
      if (!q) continue;
      if (!firstFit) firstFit = { m, q, mode: 'gpu' };
      const tps = this._predictTps(m, q);
      if (tps == null || tps >= this._tkPref) return { m, q, mode: 'gpu' };
    }
    return firstFit;
  }

  _pickRamFit() {
    const ramCap = this._usableRam || Recommender.FALLBACK_RAM_BYTES;
    const headroom = this._speed === 'patient' ? 1.0 : 0.75;
    for (const m of this._pool) {
      const v = m.variants.Q4_K_M;
      if (v && v.approxBytes <= ramCap * headroom) return { m, q: 'Q4_K_M', mode: this._gpu ? 'partial' : 'cpu' };
    }
    return null;
  }

  _pickSmallest() {
    const small = CuratedModelCatalog.MODELS.slice().sort((a, b) => a.paramsB - b.paramsB)[0];
    return { m: small, q: 'Q4_K_M', mode: this._gpu ? 'partial' : 'cpu' };
  }

  _bestQuantForVram(m) {
    let chosen = null;
    for (const q of CuratedModelCatalog.QUANT_ORDER) {
      const v = m.variants[q];
      if (!v) continue;
      const required = v.approxBytes + FitVramMath.kvBytes(m.paramsB, Recommender.KV_RESERVE_CTX, 'q8_0') + FitVramMath.GPU_OVERHEAD;
      if (required <= this._usableVram) chosen = q;
    }
    return chosen;
  }

  _predictTps(m, q) {
    const v = m && m.variants && m.variants[q];
    if (!v) return null;
    const est = CatalogDecodeEstimator.estimate({
      approxBytes: v.approxBytes, paramsB: m.paramsB,
      activeParamsB: m.moe && m.moe.activeParamsB, maxContext: m.maxContext,
    }, this._hw);
    return est && est.at8k > 0 ? est.at8k : null;
  }

  _resolveContext() {
    const model = this._pick.m;
    this._ctx = Math.min(Recommender.CTX_TARGET[this._ctxPref] || Recommender.CTX_TARGET.medium, model.maxContext);
    this._kvCacheType = 'f16';
    if (this._pick.mode !== 'gpu') return;
    const room = Math.max(0, this._usableVram - model.variants[this._pick.q].approxBytes - FitVramMath.GPU_OVERHEAD);
    if (FitVramMath.kvBytes(model.paramsB, this._ctx, 'f16') > room) this._kvCacheType = 'q8_0';
    while (this._ctx > Recommender.MIN_CONTEXT && FitVramMath.kvBytes(model.paramsB, this._ctx, this._kvCacheType) > room) {
      this._ctx = Math.floor(this._ctx / 2);
    }
    this._ctx = Math.max(Recommender.MIN_CONTEXT, this._ctx);
  }

  _createRecommendation() {
    const { m: model, q: quant, mode } = this._pick;
    const variant = model.variants[quant];
    const predictedTps = this._predictTps(model, quant);
    const dl = CuratedModelCatalog.resolveUrl(model, quant);
    return {
      modelId: model.id,
      label: model.label,
      quant,
      file: dl.file,
      url: dl.url,
      approxBytes: variant.approxBytes,
      contextSize: this._ctx,
      runtimeId: this._runtimeId,
      kvCacheType: this._kvCacheType,
      mode,
      rationale: RecommenderRationale.build({
        useCase: this._useCase, model, quant, mode, usableVram: this._usableVram, ctx: this._ctx,
        ctxPref: this._ctxPref, kvCacheType: this._kvCacheType, tkPref: this._tkPref, speed: this._speed, predictedTps,
      }),
      predictedTps,
      warnId: mode === 'cpu' ? 'cpu-only' : mode === 'partial' ? 'partial-offload' : null,
    };
  }
}

module.exports = Recommender;
