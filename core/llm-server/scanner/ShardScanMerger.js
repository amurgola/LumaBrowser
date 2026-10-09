const GgufTensorLayout = require('../GgufTensorLayout');

class ShardScanMerger {
  static TOLERANCE_FRACTION = 0.01;

  static TOLERANCE_FLOOR_BYTES = 64 * 1024 * 1024;

  static async merge(model, firstResult, headerCache) {
    if (!ShardScanMerger._isCompleteSplit(model, firstResult)) return;
    const gguf = model.gguf;
    const scans = await ShardScanMerger._collectScans(model.weights, firstResult, headerCache, gguf);
    if (!scans) return;
    const derived = GgufTensorLayout.derive(GgufTensorLayout.merge(scans), gguf.blockCount);
    if (derived.error || !derived.tensorLayout) {
      gguf.attnScanError = derived.error || 'merged tensor scan incomplete';
      return;
    }
    if (!ShardScanMerger._coversWeights(derived.tensorLayout, model, gguf)) return;
    ShardScanMerger._apply(gguf, derived);
  }

  static _isCompleteSplit(model, firstResult) {
    const weights = Array.isArray(model.weights) ? model.weights : [];
    if (weights.length < 2) return false;
    const gguf = model.gguf;
    if (!gguf || !gguf.parsed || !gguf.blockCount) return false;
    const expected = Number(model.weightsExpectedShards) || weights.length;
    return weights.length === expected && !!firstResult.tensorScan;
  }

  static async _collectScans(weights, firstResult, headerCache, gguf) {
    const scans = [firstResult.tensorScan];
    for (const shard of weights.slice(1)) {
      const result = await headerCache.get(shard.path, shard.sizeBytes);
      if (!result || !result.ok || !result.tensorScan) {
        const reason = result && result.error ? ` (${result.error})` : '';
        gguf.attnScanError = `shard ${shard.name || shard.path} tensor scan unavailable${reason}`;
        return null;
      }
      scans.push(result.tensorScan);
    }
    return scans;
  }

  static _coversWeights(layout, model, gguf) {
    const total = Number(model.weightsTotalBytes) || 0;
    const tolerance = Math.max(total * ShardScanMerger.TOLERANCE_FRACTION, ShardScanMerger.TOLERANCE_FLOOR_BYTES);
    if (total > 0 && Math.abs(layout.totalBytes - total) > tolerance) {
      gguf.attnScanError = `merged tensor scan covers ${layout.totalBytes} of ${total} weight bytes`;
      return false;
    }
    return true;
  }

  static _apply(gguf, derived) {
    gguf.attnKvPerLayer = derived.attnKvPerLayer;
    gguf.attnKvLayerCount = derived.attnKvLayerCount;
    gguf.mtpGrafted = derived.mtpGrafted;
    gguf.tensorLayout = derived.tensorLayout;
    gguf.attnScanError = null;
  }
}

module.exports = ShardScanMerger;
