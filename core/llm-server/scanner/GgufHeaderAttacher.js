const ModelClassifier = require('./ModelClassifier');
const ShardScanMerger = require('./ShardScanMerger');

class GgufHeaderAttacher {
  static FIELDS = [
    'architecture', 'name', 'blockCount', 'contextLength', 'embeddingLength', 'feedForwardLength',
    'headCount', 'headCountKv', 'headCountKvPerLayer', 'keyLength', 'valueLength', 'keyLengthSwa',
    'valueLengthSwa', 'slidingWindow', 'slidingWindowPattern', 'slidingWindowPerLayer', 'attnKvPerLayer',
    'attnKvLayerCount', 'mtpGrafted', 'attnScanError', 'tensorLayout', 'ropeFreqBase', 'expertCount',
    'expertUsedCount', 'expertFeedForwardLength', 'expertSharedCount', 'vocabSize', 'fileType',
    'fileTypeName', 'quantizationVersion',
  ];

  static isTarget(model) {
    return model.kind === 'weights' && !!(model.weights && model.weights[0] && model.weights[0].path);
  }

  static async attach(model, headerCache) {
    const first = model.weights[0];
    const result = await headerCache.get(first.path, first.sizeBytes);
    if (!(result && result.ok)) {
      model.gguf = { parsed: false, error: (result && result.error) || 'unknown parse error' };
      return;
    }
    model.gguf = GgufHeaderAttacher.factsOf(result);
    await ShardScanMerger.merge(model, result, headerCache);
    ModelClassifier.augmentFromGguf(model);
  }

  static factsOf(result) {
    const facts = { parsed: true };
    for (const field of GgufHeaderAttacher.FIELDS) facts[field] = result[field];
    return facts;
  }
}

module.exports = GgufHeaderAttacher;
