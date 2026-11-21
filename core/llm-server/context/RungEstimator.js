const KvCacheModes = require('../../shared/llm/KvCacheModes');
const StartPlanPreview = require('../server/launcher/StartPlanPreview');

class RungEstimator {
  static ESTIMATE_PORT = StartPlanPreview.PORT;

  constructor({ planFor, catalog, preview = new StartPlanPreview({ planFor, catalog }) }) {
    this._preview = preview;
  }

  estimate(model, runtime, diagnostics, tokens, kv = 'f16', options = {}) {
    if (!runtime || !runtime.binaryPath) return RungEstimator._unknown();
    try {
      return RungEstimator._stateFromPlan(this._startPlan(model, runtime, diagnostics, tokens, kv, options));
    } catch (_) {
      return RungEstimator._unknown();
    }
  }

  predictedTpsAtDepth(model, runtime, diagnostics, depthTokens, kv, options = {}) {
    const tokens = Math.floor(Number(depthTokens)) || 0;
    if (tokens <= 0) return null;
    try {
      return RungEstimator.predictedTps(this.estimate(model, runtime, diagnostics, tokens, kv, options));
    } catch (_) {
      return null;
    }
  }

  static predictedTps(estimate) {
    const decode = estimate && estimate.decode;
    const tps = decode ? Number(decode.atFull) : NaN;
    return Number.isFinite(tps) && tps > 0 ? tps : null;
  }

  _startPlan(model, runtime, diagnostics, tokens, kv, { settingsDb = null, measured = null }) {
    return this._preview.plan({ model, runtime, diagnostics, settingsDb, overrides: RungEstimator._overrides(tokens, kv, measured) });
  }

  static _overrides(tokens, kv, measured) {
    const { k, v } = KvCacheModes.pair(kv);
    const overrides = { contextSize: tokens, cacheTypeK: k, cacheTypeV: v, suppressMmprojLoad: true };
    if (measured && Number(measured.vramBytes) > 0) {
      overrides.measuredVramBytes = Math.round(Number(measured.vramBytes));
      overrides.measuredFullOffload = measured.fullOffload === true;
      overrides.measuredShape = typeof measured.shape === 'string' ? measured.shape : null;
    }
    return overrides;
  }

  static _stateFromPlan(plan) {
    const decode = plan.decodeEstimate || null;
    if (plan.fullOffload) {
      return {
        state: 'ok',
        vramBytes: plan.modelEstimatedBytes || null,
        usableVramBytes: plan.fullOffloadRoomBytes || plan.vramAvailableBytes || null,
        softHeadroom: !!plan.softHeadroom,
        cards: RungEstimator._cardsHoldingLayers(plan),
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

  static _cardsHoldingLayers(plan) {
    const split = plan.layerSplit && Array.isArray(plan.layerSplit.perDevice) ? plan.layerSplit.perDevice : null;
    if (split) return split.filter((device) => device.layers > 0).map((device) => device.name);
    return (Array.isArray(plan.perGpu) ? plan.perGpu : []).map((card) => card.name);
  }

  static _unknown() {
    return { state: 'unknown', vramBytes: null };
  }
}

module.exports = RungEstimator;
