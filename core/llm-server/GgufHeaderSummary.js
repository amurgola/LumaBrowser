const GgufTensorLayout = require('./GgufTensorLayout');

class GgufHeaderSummary {
  static WANTED_EXACT = new Set([
    'general.architecture', 'general.name', 'general.basename',
    'general.size_label', 'general.file_type', 'general.quantization_version',
    'general.alignment',
  ]);

  static WANTED_SUFFIX = /\.(block_count|context_length|embedding_length|feed_forward_length|attention\.head_count|attention\.head_count_kv|attention\.key_length|attention\.value_length|attention\.key_length_swa|attention\.value_length_swa|attention\.sliding_window|attention\.sliding_window_pattern|rope\.freq_base|rope\.dimension_count|expert_count|expert_used_count|expert_feed_forward_length|expert_shared_count|vocab_size)$/;

  static FTYPE_NAMES = {
    0: 'F32', 1: 'F16', 2: 'Q4_0', 3: 'Q4_1', 7: 'Q8_0', 8: 'Q5_0', 9: 'Q5_1',
    10: 'Q2_K', 11: 'Q3_K_S', 12: 'Q3_K_M', 13: 'Q3_K_L', 14: 'Q4_K_S',
    15: 'Q4_K_M', 16: 'Q5_K_S', 17: 'Q5_K_M', 18: 'Q6_K', 19: 'IQ2_XXS',
    20: 'IQ2_XS', 21: 'Q2_K_S', 22: 'IQ3_XS', 23: 'IQ3_XXS', 24: 'IQ1_S',
    25: 'IQ4_NL', 26: 'IQ3_S', 27: 'IQ3_M', 28: 'IQ2_S', 29: 'IQ2_M',
    30: 'IQ4_XS', 31: 'IQ1_M', 32: 'BF16', 36: 'TQ1_0', 37: 'TQ2_0',
  };

  static wants(key) {
    return GgufHeaderSummary.WANTED_EXACT.has(key) || GgufHeaderSummary.WANTED_SUFFIX.test(key);
  }

  static numberOrNull(value) {
    if (value === undefined || value === null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  static build({ meta, version, tensorCount, kvCount, tensorScan, tensorScanError }) {
    const pick = GgufHeaderSummary._picker(meta);
    const blockCount = GgufHeaderSummary.numberOrNull(pick('block_count'));
    const derived = GgufTensorLayout.derive(tensorScan, blockCount);
    return {
      ok: true,
      version,
      tensorCount,
      kvCount,
      ...GgufHeaderSummary._identity(meta),
      blockCount,
      ...GgufHeaderSummary._attentionShape(pick),
      ...GgufHeaderSummary._tensorFacts(derived, tensorScan, tensorScanError),
      ...GgufHeaderSummary._ropeAndExperts(pick),
      ...GgufHeaderSummary._quantisation(meta),
    };
  }

  static _picker(meta) {
    const arch = meta['general.architecture'] || null;
    return (suffix) => (arch && meta[`${arch}.${suffix}`] !== undefined ? meta[`${arch}.${suffix}`] : undefined);
  }

  static _identity(meta) {
    return {
      architecture: meta['general.architecture'] || null,
      name: meta['general.name'] || meta['general.basename'] || null,
      sizeLabel: meta['general.size_label'] || null,
    };
  }

  static _attentionShape(pick) {
    const num = GgufHeaderSummary.numberOrNull;
    const headCountKv = pick('attention.head_count_kv');
    const slidingPattern = pick('attention.sliding_window_pattern');
    return {
      contextLength: num(pick('context_length')),
      embeddingLength: num(pick('embedding_length')),
      feedForwardLength: num(pick('feed_forward_length')),
      headCount: num(pick('attention.head_count')),
      headCountKv: Array.isArray(headCountKv) ? null : num(headCountKv),
      headCountKvPerLayer: Array.isArray(headCountKv) ? headCountKv.map(Number) : null,
      keyLength: num(pick('attention.key_length')),
      valueLength: num(pick('attention.value_length')),
      slidingWindow: num(pick('attention.sliding_window')),
      slidingWindowPattern: Array.isArray(slidingPattern) ? null : num(slidingPattern),
      slidingWindowPerLayer: Array.isArray(slidingPattern) ? slidingPattern.map(Boolean) : null,
      keyLengthSwa: num(pick('attention.key_length_swa')),
      valueLengthSwa: num(pick('attention.value_length_swa')),
    };
  }

  static _tensorFacts(derived, tensorScan, tensorScanError) {
    return {
      attnKvPerLayer: derived.attnKvPerLayer,
      attnKvLayerCount: derived.attnKvLayerCount,
      mtpGrafted: derived.mtpGrafted,
      attnScanError: tensorScanError || derived.error || null,
      tensorLayout: derived.tensorLayout,
      tensorScan,
    };
  }

  static _ropeAndExperts(pick) {
    const num = GgufHeaderSummary.numberOrNull;
    return {
      ropeFreqBase: num(pick('rope.freq_base')),
      ropeDimensionCount: num(pick('rope.dimension_count')),
      expertCount: num(pick('expert_count')),
      expertUsedCount: num(pick('expert_used_count')),
      expertFeedForwardLength: num(pick('expert_feed_forward_length')),
      expertSharedCount: num(pick('expert_shared_count')),
      vocabSize: num(pick('vocab_size')),
    };
  }

  static _quantisation(meta) {
    const fileType = meta['general.file_type'];
    const known = fileType !== undefined;
    return {
      fileType: known ? fileType : null,
      fileTypeName: known ? (GgufHeaderSummary.FTYPE_NAMES[fileType] || `ftype ${fileType}`) : null,
      quantizationVersion: GgufHeaderSummary.numberOrNull(meta['general.quantization_version']),
    };
  }
}

module.exports = GgufHeaderSummary;
