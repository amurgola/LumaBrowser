class MoeEstimator {
  static RESIDENT_SAFETY = 1.15;
  static RESIDENT_FLOOR_FRACTION = 0.1;

  static estimateSplit(gguf, totalBytes) {
    const bytes = Number(totalBytes) || 0;
    if (!gguf || bytes <= 0) return null;
    if ((Number(gguf.expertCount) || 0) <= 1) return null;
    return MoeEstimator._exactSplit(gguf, bytes) || MoeEstimator._ratioSplit(gguf, bytes);
  }

  static _exactSplit(gguf, bytes) {
    const blocks = Number(gguf.blockCount) || 0;
    const layout = gguf.tensorLayout;
    if (!(blocks > 0 && layout && Array.isArray(layout.expertBytesPerBlock) && layout.expertBytesPerBlock.length === blocks)) return null;
    const expertBytesPerBlock = layout.expertBytesPerBlock.map((v) => Math.max(0, Number(v) || 0));
    const expertBytes = expertBytesPerBlock.reduce((sum, v) => sum + v, 0);
    if (!(expertBytes > 0 && expertBytes < bytes)) return null;
    const hostBytes = Math.min(Math.max(0, Number(layout.hostBytes) || 0), bytes - expertBytes);
    return {
      expertFraction: expertBytes / bytes,
      expertBytes,
      residentBytes: bytes - expertBytes - hostBytes,
      hostBytes,
      expertBytesPerBlock,
      exact: true,
    };
  }

  static _ratioSplit(gguf, bytes) {
    const params = MoeEstimator._parameterCounts(gguf);
    if (!params) return null;
    const total = params.expert + params.attention + params.sharedExpert + params.embedding + params.norm;
    if (!(total > 0)) return null;
    const expertFraction = params.expert / total;
    const residentBytes = MoeEstimator._conservativeResident(bytes, expertFraction);
    return {
      expertFraction,
      expertBytes: Math.max(0, bytes - residentBytes),
      residentBytes,
      hostBytes: 0,
      expertBytesPerBlock: null,
      exact: false,
    };
  }

  static _parameterCounts(gguf) {
    const blocks = Number(gguf.blockCount) || 0;
    const experts = Number(gguf.expertCount) || 0;
    const dModel = Number(gguf.embeddingLength) || 0;
    const dFf = Number(gguf.expertFeedForwardLength) || Number(gguf.feedForwardLength) || 0;
    if (!blocks || !dModel || !dFf) return null;
    const sharedExperts = Number(gguf.expertSharedCount) || 0;
    return {
      expert: blocks * experts * 3 * dModel * dFf,
      attention: MoeEstimator._attentionParams(gguf, blocks, dModel),
      sharedExpert: sharedExperts > 0 ? blocks * sharedExperts * 3 * dModel * dFf : 0,
      embedding: 2 * (Number(gguf.vocabSize) || 0) * dModel,
      norm: blocks * 2 * dModel,
    };
  }

  static _attentionParams(gguf, blocks, dModel) {
    const heads = Number(gguf.headCount) || 0;
    const kvHeads = Number(gguf.headCountKv) || heads;
    const headDim = Number(gguf.keyLength) || (heads > 0 ? Math.floor(dModel / heads) : 0);
    if (heads > 0 && headDim > 0) {
      return blocks * (2 * dModel * heads * headDim + 2 * dModel * kvHeads * headDim);
    }
    return blocks * 4 * dModel * dModel;
  }

  static _conservativeResident(bytes, expertFraction) {
    const rawResident = bytes * (1 - expertFraction);
    return Math.min(
      bytes,
      Math.max(
        Math.round(bytes * MoeEstimator.RESIDENT_FLOOR_FRACTION),
        Math.round(rawResident * MoeEstimator.RESIDENT_SAFETY),
      ),
    );
  }
}

module.exports = MoeEstimator;
