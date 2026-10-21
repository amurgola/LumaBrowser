const GgufTensorLayout = require('./GgufTensorLayout');
const GgufRoleTable = require('./GgufRoleTable');

class GgufHeaderSummary {
  static WANTED_EXACT = new Set([
    'general.architecture', 'general.name', 'general.basename', 'general.type',
    'general.size_label', 'general.file_type', 'general.quantization_version',
    'general.alignment', 'general.parameter_count', 'tokenizer.chat_template',
  ]);

  static WANTED_SUFFIX = /\.(block_count|context_length|embedding_length|feed_forward_length|attention\.head_count|attention\.head_count_kv|attention\.key_length|attention\.value_length|attention\.key_length_swa|attention\.value_length_swa|attention\.sliding_window|attention\.sliding_window_pattern|rope\.freq_base|rope\.dimension_count|expert_count|expert_used_count|expert_feed_forward_length|expert_shared_count|vocab_size|pooling_type)$/;

  static CLIP_KEY = /^clip\./;

  static WANTED_CLIP = /^clip\.(projector_type|has_vision_encoder|has_audio_encoder|has_llava_projector)$/;

  static CHAT_TEMPLATE_MAX_CHARS = 32 * 1024;

  static FTYPE_NAMES = {
    0: 'F32', 1: 'F16', 2: 'Q4_0', 3: 'Q4_1', 7: 'Q8_0', 8: 'Q5_0', 9: 'Q5_1',
    10: 'Q2_K', 11: 'Q3_K_S', 12: 'Q3_K_M', 13: 'Q3_K_L', 14: 'Q4_K_S',
    15: 'Q4_K_M', 16: 'Q5_K_S', 17: 'Q5_K_M', 18: 'Q6_K', 19: 'IQ2_XXS',
    20: 'IQ2_XS', 21: 'Q2_K_S', 22: 'IQ3_XS', 23: 'IQ3_XXS', 24: 'IQ1_S',
    25: 'IQ4_NL', 26: 'IQ3_S', 27: 'IQ3_M', 28: 'IQ2_S', 29: 'IQ2_M',
    30: 'IQ4_XS', 31: 'IQ1_M', 32: 'BF16', 36: 'TQ1_0', 37: 'TQ2_0', 38: 'MXFP4_MOE',
  };

  static GGML_TYPE_NAMES = {
    0: 'F32', 1: 'F16', 2: 'Q4_0', 3: 'Q4_1', 6: 'Q5_0', 7: 'Q5_1', 8: 'Q8_0', 9: 'Q8_1',
    10: 'Q2_K', 11: 'Q3_K', 12: 'Q4_K', 13: 'Q5_K', 14: 'Q6_K', 15: 'Q8_K',
    16: 'IQ2_XXS', 17: 'IQ2_XS', 18: 'IQ3_XXS', 19: 'IQ1_S', 20: 'IQ4_NL', 21: 'IQ3_S', 22: 'IQ2_S', 23: 'IQ4_XS',
    24: 'I8', 25: 'I16', 26: 'I32', 27: 'I64', 28: 'F64', 29: 'IQ1_M', 30: 'BF16',
    34: 'TQ1_0', 35: 'TQ2_0', 39: 'MXFP4',
  };

  static wants(key) {
    return GgufHeaderSummary.WANTED_EXACT.has(key)
      || GgufHeaderSummary.WANTED_SUFFIX.test(key)
      || GgufHeaderSummary.WANTED_CLIP.test(key);
  }

  static numberOrNull(value) {
    if (value === undefined || value === null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  static build({ meta, version, tensorCount, kvCount, tensorScan, tensorScanError, hasClipKeys = false }) {
    const pick = GgufHeaderSummary._picker(meta);
    const blockCount = GgufHeaderSummary.numberOrNull(pick('block_count'));
    const derived = GgufTensorLayout.derive(tensorScan, blockCount);
    return {
      ok: true,
      version,
      tensorCount,
      kvCount,
      ...GgufHeaderSummary._identity(meta),
      ...GgufHeaderSummary._role(meta, pick, tensorScan, hasClipKeys),
      ...GgufHeaderSummary._parameterCount(meta, tensorScan),
      ...GgufHeaderSummary._chatTemplate(meta),
      blockCount,
      ...GgufHeaderSummary._attentionShape(pick),
      ...GgufHeaderSummary._tensorFacts(derived, tensorScan, tensorScanError),
      ...GgufHeaderSummary._ropeAndExperts(pick),
      ...GgufHeaderSummary._quantisation(meta, tensorScan),
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
      baseName: meta['general.basename'] || null,
      sizeLabel: meta['general.size_label'] || null,
      generalType: typeof meta['general.type'] === 'string' ? meta['general.type'] : null,
    };
  }

  static _role(meta, pick, tensorScan, hasClipKeys) {
    const poolingType = GgufHeaderSummary.numberOrNull(pick('pooling_type'));
    const projectorType = typeof meta['clip.projector_type'] === 'string' ? meta['clip.projector_type'] : null;
    const decided = GgufRoleTable.headerRole({
      architecture: meta['general.architecture'],
      generalType: meta['general.type'],
      poolingType,
      hasClipKeys: hasClipKeys || projectorType !== null,
      tensorScan,
    });
    return {
      role: decided.role,
      roleSource: decided.role ? 'header' : null,
      roleReason: decided.reason,
      poolingType,
      projectorType,
    };
  }

  static _parameterCount(meta, tensorScan) {
    const declared = GgufHeaderSummary.numberOrNull(meta['general.parameter_count']);
    if (declared !== null && declared > 0) return { parameterCount: declared, parameterCountSource: 'header' };
    const counted = tensorScan ? GgufHeaderSummary.numberOrNull(tensorScan.elementCount) : null;
    if (counted !== null && counted > 0) return { parameterCount: counted, parameterCountSource: 'tensors' };
    return { parameterCount: null, parameterCountSource: null };
  }

  static _chatTemplate(meta) {
    const raw = meta['tokenizer.chat_template'];
    if (typeof raw !== 'string' || raw.length === 0) {
      return { chatTemplate: null, hasChatTemplate: false, chatTemplateLength: 0, chatTemplateTruncated: false };
    }
    const max = GgufHeaderSummary.CHAT_TEMPLATE_MAX_CHARS;
    return {
      chatTemplate: raw.length > max ? raw.slice(0, max) : raw,
      hasChatTemplate: true,
      chatTemplateLength: raw.length,
      chatTemplateTruncated: raw.length > max,
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

  static _quantisation(meta, tensorScan) {
    const fileType = meta['general.file_type'];
    const known = fileType !== undefined;
    const tableName = known ? GgufHeaderSummary.FTYPE_NAMES[fileType] : undefined;
    const dominantTensorType = GgufHeaderSummary._dominantTypeName(tensorScan);
    let fileTypeName = null;
    let fileTypeSource = null;
    if (tableName) { fileTypeName = tableName; fileTypeSource = 'header'; }
    else if (dominantTensorType) { fileTypeName = dominantTensorType; fileTypeSource = 'tensors'; }
    else if (known) { fileTypeName = `ftype ${fileType}`; fileTypeSource = 'header'; }
    return {
      fileType: known ? fileType : null,
      fileTypeName,
      fileTypeSource,
      dominantTensorType,
      quantizationVersion: GgufHeaderSummary.numberOrNull(meta['general.quantization_version']),
    };
  }

  static _dominantTypeName(tensorScan) {
    const type = GgufTensorLayout.dominantType(tensorScan);
    if (type === null) return null;
    return GgufHeaderSummary.GGML_TYPE_NAMES[type] || `ggml type ${type}`;
  }
}

module.exports = GgufHeaderSummary;
