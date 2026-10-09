class FlowSchedule {
  static FAMILIES = {
    'qwen-image-2': { baseShift: 0.5, maxShift: 0.9, baseSeqLen: 256, maxSeqLen: 8192, patch: 16 },
  };

  static SIGMA_DECIMALS = 6;

  static flowMu(family, width, height) {
    const shape = FlowSchedule.FAMILIES[family];
    if (!shape) return null;
    const seqLen = FlowSchedule._sequenceLength(shape, width, height);
    if (!(seqLen > 0)) return null;
    const slope = (shape.maxShift - shape.baseShift) / (shape.maxSeqLen - shape.baseSeqLen);
    return seqLen * slope + (shape.baseShift - slope * shape.baseSeqLen);
  }

  static timeShift(mu, t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const e = Math.exp(mu);
    return e / (e + (1 / t - 1));
  }

  static sigmasFromNodes({ nodes, family, width, height } = {}) {
    const list = Array.isArray(nodes) ? nodes.map(Number) : [];
    if (!FlowSchedule._isUsableSchedule(list)) return null;
    const mu = FlowSchedule.flowMu(family, width, height);
    if (mu == null) return null;
    const shifted = list.map((t) => Number(FlowSchedule.timeShift(mu, t).toFixed(FlowSchedule.SIGMA_DECIMALS)));
    return [...shifted, 0];
  }

  static _sequenceLength(shape, width, height) {
    return Math.floor(Number(width) / shape.patch) * Math.floor(Number(height) / shape.patch);
  }

  static _isUsableSchedule(list) {
    if (!list.length || list.some((n) => !(n > 0 && n <= 1))) return false;
    for (let i = 1; i < list.length; i++) if (!(list[i] < list[i - 1])) return false;
    return true;
  }
}

module.exports = FlowSchedule;
