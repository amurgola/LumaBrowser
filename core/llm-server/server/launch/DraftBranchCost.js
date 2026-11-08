class DraftBranchCost {
  static GIB = 1024 * 1024 * 1024;

  static WEIGHT_FRACTION = 0.06;

  static WEIGHT_FLOOR = Math.round(1.5 * DraftBranchCost.GIB);

  static SCRATCH = 256 * 1024 * 1024;

  static MTP_BRANCH_FIXED = Math.round(2.2 * DraftBranchCost.GIB);

  static RECURRENT_STATE_PER_LAYER_TOKEN = Math.round(2.8 * 1024 * 1024);

  static bytes({ modelBytes, kvPerLayer, draftKvPerLayer, drafterBytes = 0, mtp = false, mtpHeadBytes = 0, draftN = 0, recurrentLayers = 0 }) {
    if (mtp) return mtpHeadBytes + DraftBranchCost.MTP_BRANCH_FIXED;
    const draftWeights = drafterBytes > 0
      ? drafterBytes
      : Math.max(DraftBranchCost.WEIGHT_FLOOR, modelBytes * DraftBranchCost.WEIGHT_FRACTION);
    const draftKv = typeof draftKvPerLayer === 'number' ? draftKvPerLayer : kvPerLayer;
    return draftWeights + draftKv + DraftBranchCost.SCRATCH + DraftBranchCost.recurrentCheckpoints(draftN, recurrentLayers);
  }

  static recurrentCheckpoints(draftN, recurrentLayers) {
    const n = Math.max(0, Math.floor(Number(draftN) || 0));
    const layers = Math.max(0, Math.floor(Number(recurrentLayers) || 0));
    return n * layers * DraftBranchCost.RECURRENT_STATE_PER_LAYER_TOKEN;
  }
}

module.exports = DraftBranchCost;
