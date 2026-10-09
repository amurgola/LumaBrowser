const GgufFileName = require('./GgufFileName');

class GgufVariantGrouper {
  static UNKNOWN_BIT_WIDTH_RANK = 99;

  static group(entries) {
    const byQuant = new Map();
    for (const entry of entries || []) {
      if (GgufVariantGrouper._isWeightsFile(entry)) GgufVariantGrouper._addPart(byQuant, entry);
    }
    const variants = [...byQuant.values()];
    variants.forEach(GgufVariantGrouper._sortShardParts);
    return variants.sort(GgufVariantGrouper._byBitWidthThenName);
  }

  static _isWeightsFile(entry) {
    if (!entry || entry.type === 'directory') return false;
    const path = entry.path || '';
    if (!GgufFileName.isGguf(path)) return false;
    const base = GgufFileName.basename(path);
    if (GgufFileName.isMmproj(base) || GgufFileName.isImatrix(base)) return false;
    if (GgufFileName.isMtpHead(path)) return false;
    return GgufFileName.quantOf(base) !== null;
  }

  static _addPart(byQuant, entry) {
    const path = entry.path;
    const base = GgufFileName.basename(path);
    const quant = GgufFileName.quantOf(base);
    const variant = byQuant.get(quant) || GgufVariantGrouper._newVariant(quant, base, path);
    byQuant.set(quant, variant);
    variant.approxBytes += Number(entry.size) || 0;
    variant.partPaths.push(path);
    GgufVariantGrouper._noteShard(variant, base, path);
  }

  static _newVariant(quant, file, path) {
    return { quant, file, path, approxBytes: 0, sharded: false, partPaths: [] };
  }

  static _noteShard(variant, base, path) {
    const { shard } = GgufFileName.split(base);
    if (!shard) return;
    variant.sharded = true;
    if (shard.i === 1) {
      variant.file = base;
      variant.path = path;
    }
  }

  static _sortShardParts(variant) {
    if (!variant.sharded || variant.partPaths.length < 2) return;
    variant.partPaths.sort((a, b) => GgufFileName.shardIndex(a) - GgufFileName.shardIndex(b));
  }

  static _byBitWidthThenName(a, b) {
    return GgufVariantGrouper._rank(a.quant) - GgufVariantGrouper._rank(b.quant)
      || a.quant.localeCompare(b.quant);
  }

  static _rank(quant) {
    const bits = GgufFileName.bitWidth(quant);
    return bits === null ? GgufVariantGrouper.UNKNOWN_BIT_WIDTH_RANK : bits;
  }
}

module.exports = GgufVariantGrouper;
