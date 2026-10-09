class AssetSizing {
  static MIN_ASSET_DIM = 16;
  static MAX_ASSET_DIM = 1024;
  static SMALL_ASSET_NATIVE = 256;
  static LOGICAL_PIXEL_MAX = 256;
  static MAX_PIXEL_SIZE = 16;
  static GEN_GRID = 16;
  static GEN_TIERS = [[64, 512], [128, 768]];

  static clampDim(n, fallback = 256) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return fallback;
    return Math.max(AssetSizing.MIN_ASSET_DIM, Math.min(AssetSizing.MAX_ASSET_DIM, Math.round(v / 8) * 8));
  }

  static pixelGridFor(outW, outH, pixelSize) {
    const scale = AssetSizing._pixelScale(outW, outH, pixelSize);
    return {
      logicalW: Math.max(1, Math.round(outW / scale)),
      logicalH: Math.max(1, Math.round(outH / scale)),
      pixelScale: scale,
    };
  }

  static genDimsFor(scaleUp, outW, outH, native = null) {
    if (!scaleUp) return { genW: outW, genH: outH };
    const longGrid = Math.max(outW, outH);
    const target = Math.min(AssetSizing._nativeLong(native), AssetSizing.genTargetFor(longGrid));
    const factor = Math.max(1, Math.floor(target / longGrid));
    return { genW: AssetSizing._snapGen(outW * factor), genH: AssetSizing._snapGen(outH * factor) };
  }

  static genTargetFor(gridLong) {
    for (const [maxGrid, target] of AssetSizing.GEN_TIERS) if (gridLong <= maxGrid) return target;
    return Infinity;
  }

  static _pixelScale(outW, outH, pixelSize) {
    const explicit = Number(pixelSize);
    if (Number.isFinite(explicit) && explicit >= 1) return Math.min(AssetSizing.MAX_PIXEL_SIZE, Math.round(explicit));
    const need = Math.max(1, Math.ceil(Math.max(outW, outH) / AssetSizing.LOGICAL_PIXEL_MAX));
    for (let sc = need; sc <= Math.min(AssetSizing.MAX_PIXEL_SIZE, need * 2); sc++) {
      if (outW % sc === 0 && outH % sc === 0) return sc;
    }
    return need;
  }

  static _nativeLong(native) {
    const nw = native && Number(native.width) > 0 ? Number(native.width) : 512;
    const nh = native && Number(native.height) > 0 ? Number(native.height) : 512;
    return Math.max(512, Math.max(nw, nh));
  }

  static _snapGen(v) {
    return Math.max(AssetSizing.GEN_GRID, Math.floor(v / AssetSizing.GEN_GRID) * AssetSizing.GEN_GRID);
  }
}

module.exports = AssetSizing;
