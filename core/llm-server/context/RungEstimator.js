const KvCacheModes = require('../../shared/llm/KvCacheModes');

class RungEstimator {
  static ESTIMATE_PORT = 8080;

  constructor({ planFor, catalog }) {
    this._planFor = planFor;
    this._catalog = catalog;
  }

  estimate(model, runtime, diagnostics, tokens, kv = 'f16') {
    if (!runtime || !runtime.binaryPath) return RungEstimator._unknown();
    try {
      return RungEstimator._stateFromPlan(this._plan(model, runtime, diagnostics, tokens, kv));
    } catch (_) {
      return RungEstimator._unknown();
    }
  }

  predictedTpsAtDepth(model, runtime, diagnostics, depthTokens, kv) {
    const tokens = Math.floor(Number(depthTokens)) || 0;
    if (tokens <= 0) return null;
    try {
      return RungEstimator.predictedTps(this.estimate(model, runtime, diagnostics, tokens, kv));
    } catch (_) {
      return null;
    }
  }

  static predictedTps(estimate) {
    const decode = estimate && estimate.decode;
    const tps = decode ? Number(decode.atFull) : NaN;
    return Number.isFinite(tps) && tps > 0 ? tps : null;
  }

  _plan(model, runtime, diagnostics, tokens, kv) {
    const { k, v } = KvCacheModes.pair(kv);
    const out = this._planFor.plan({
      model,
      runtime,
      runtimeCatalogEntry: this._catalog.getById(runtime.id),
      diagnostics,
      port: RungEstimator.ESTIMATE_PORT,
      overrides: { contextSize: tokens, cacheTypeK: k, cacheTypeV: v },
    });
    return out.plan || {};
  }

  static _stateFromPlan(plan) {
    const decode = plan.decodeEstimate || null;
    if (plan.fullOffload) {
      return {
        state: 'ok',
        vramBytes: plan.modelEstimatedBytes || null,
        usableVramBytes: plan.vramAvailableBytes || null,
        decode,
      };
    }
    const partial = plan.partial || null;
    if (partial && partial.ngl > 0) {
      return {
        state: 'partial',
        vramBytes: null,
        ngl: partial.ngl,
        layerCount: partial.layerCount || null,
        perLayerBytes: partial.perLayerBytes || null,
        decode,
      };
    }
    return {
      state: 'no',
      vramBytes: null,
      layerCount: (partial && partial.layerCount) || null,
      perLayerBytes: (partial && partial.perLayerBytes) || null,
      decode,
    };
  }

  static _unknown() {
    return { state: 'unknown', vramBytes: null };
  }
}

module.exports = RungEstimator;
