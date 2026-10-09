class DraftBranchCost {
  static GIB = 1024 * 1024 * 1024;

  static WEIGHT_FRACTION = 0.06;

  static WEIGHT_FLOOR = Math.round(1.5 * DraftBranchCost.GIB);

  static SCRATCH = 256 * 1024 * 1024;

  static MTP_BRANCH_FIXED = Math.round(2.2 * DraftBranchCost.GIB);

  static bytes({ modelBytes, kvPerLayer, draftKvPerLayer, drafterBytes = 0, mtp = false, mtpHeadBytes = 0 }) {
    if (mtp) return mtpHeadBytes + DraftBranchCost.MTP_BRANCH_FIXED;
    const draftWeights = drafterBytes > 0
      ? drafterBytes
      : Math.max(DraftBranchCost.WEIGHT_FLOOR, modelBytes * DraftBranchCost.WEIGHT_FRACTION);
    const draftKv = typeof draftKvPerLayer === 'number' ? draftKvPerLayer : kvPerLayer;
    return draftWeights + draftKv + DraftBranchCost.SCRATCH;
  }
}

module.exports = DraftBranchCost;
