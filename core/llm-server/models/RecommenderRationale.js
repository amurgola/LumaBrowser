const DecodeFormula = require('../server/decode/DecodeFormula');

class RecommenderRationale {
  static GB = 1024 * 1024 * 1024;

  static USE_CASE_LABELS = { chat: 'general chat', development: 'development', documents: 'documents & business' };

  static SPEED_CLAUSES = {
    fast: 'so we kept it snappy by staying within VRAM.',
    patient: 'so we prioritised capability over raw speed.',
    balanced: 'so we balanced capability and speed.',
  };

  static build(input) {
    const { useCase, model, quant, ctx, ctxPref, kvCacheType, tkPref, speed, predictedTps } = input;
    const useCaseLabel = RecommenderRationale.USE_CASE_LABELS[useCase] || useCase;
    return `For ${useCaseLabel}, ${model.label} (${quant}) is the most capable model `
      + `that runs ${RecommenderRationale._modeLabel(input)}. Context set to ${ctx.toLocaleString()} tokens `
      + `for your "${ctxPref}" preference`
      + (kvCacheType === 'q8_0' ? ', with a compressed KV cache to fit VRAM' : '')
      + `. You said ~${tkPref} tok/s is the slowest you'd accept, `
      + RecommenderRationale.SPEED_CLAUSES[speed]
      + (predictedTps != null ? ` Predicted ${DecodeFormula.describeTps(predictedTps)} on this machine.` : '');
  }

  static gb(bytes) {
    const g = (Number(bytes) || 0) / RecommenderRationale.GB;
    return (g >= 10 ? g.toFixed(0) : g.toFixed(1)) + ' GB';
  }

  static _modeLabel({ mode, usableVram }) {
    if (mode === 'gpu') return `fully on your GPU (${RecommenderRationale.gb(usableVram)} usable VRAM)`;
    if (mode === 'partial') return 'split across GPU + system RAM (slower, but more capable)';
    return 'on your CPU (no usable GPU detected; expect modest speed)';
  }
}

module.exports = RecommenderRationale;
