const CuratedModelCatalog = require('../CuratedModelCatalog');
const RecommenderRuntimePicker = require('../RecommenderRuntimePicker');
const RecommenderRationale = require('../RecommenderRationale');
const DecodeFormula = require('../../server/decode/DecodeFormula');
const AutoPlanRanking = require('./AutoPlanRanking');

class LlmRecommendation {
  static build(pick, hw) {
    const download = CuratedModelCatalog.resolveUrl(pick.model, pick.quant);
    const predictedTps = AutoPlanRanking.predictedTps(pick.model, pick.quant, hw);
    return {
      modelId: pick.model.id,
      label: pick.model.label,
      quant: pick.quant,
      file: download.file,
      url: download.url,
      approxBytes: pick.model.variants[pick.quant].approxBytes,
      contextSize: pick.contextSize,
      runtimeId: RecommenderRuntimePicker.pick(hw),
      kvCacheType: pick.kvCacheType,
      mode: pick.mode === 'moe-cpu' ? 'gpu' : pick.mode,
      cpuMoe: !!pick.cpuMoe,
      rationale: LlmRecommendation._rationale(pick, hw, predictedTps),
      predictedTps,
      warnId: LlmRecommendation._warnId(pick.mode),
    };
  }

  static _rationale(pick, hw, predictedTps) {
    return `${pick.model.label} (${pick.quant}) is the most capable model that runs ${LlmRecommendation._modeText(pick.mode, hw)}. `
      + `Context set to ${pick.contextSize.toLocaleString()} tokens.`
      + (predictedTps != null ? ` Predicted ${DecodeFormula.describeTps(predictedTps)} on this machine.` : '');
  }

  static _modeText(mode, hw) {
    return {
      gpu: `entirely in your ${RecommenderRationale.gb(hw.usableVramBytes)} of graphics memory, nothing spilling to system RAM`,
      'moe-cpu': 'with its always-on layers on the GPU and its expert layers in system RAM, the fast way to run a big sparse model on this card',
      partial: 'split between GPU and system RAM',
      cpu: 'on your processor',
    }[mode];
  }

  static _warnId(mode) {
    if (mode === 'cpu') return 'cpu-only';
    if (mode === 'partial') return 'partial-offload';
    return null;
  }
}

module.exports = LlmRecommendation;
