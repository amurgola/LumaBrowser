const EditRegionMask = require('./EditRegionMask');
const NativeBitmapCodec = require('./NativeBitmapCodec');

class RegionMaskPrep {
  static GROW_SHARE = 0.02;
  static GROW_MIN_PX = 4;
  static GROW_MAX_PX = 32;
  static FEATHER_SHARE = 0.01;
  static FEATHER_MIN_PX = 2;
  static FEATHER_MAX_PX = 16;

  static prepare({ maskPng, width, height, codec = NativeBitmapCodec }) {
    const bitmap = codec.decode(maskPng);
    if (!bitmap || !(width > 0) || !(height > 0)) return null;
    const mask = EditRegionMask.resize(EditRegionMask.fromBitmap(bitmap), width, height);
    if (EditRegionMask.isEmpty(mask)) return null;
    const grown = EditRegionMask.dilate(EditRegionMask.binarize(mask), RegionMaskPrep.growPx(width, height));
    const inpaintPng = RegionMaskPrep.inpaintPng(grown, null, codec);
    if (!inpaintPng) return null;
    return {
      mask,
      grown,
      inpaintPng,
      featherPx: RegionMaskPrep.featherPx(width, height),
      coverage: EditRegionMask.coverage(mask),
      bounds: EditRegionMask.bounds(mask),
    };
  }

  static inpaintPng(grown, rect = null, codec = NativeBitmapCodec) {
    const part = rect ? EditRegionMask.crop(grown, rect) : grown;
    return codec.encodePng(EditRegionMask.toBitmap(part)) || null;
  }

  static growPx(width, height) {
    return RegionMaskPrep._scaled(width, height, RegionMaskPrep.GROW_SHARE, RegionMaskPrep.GROW_MIN_PX, RegionMaskPrep.GROW_MAX_PX);
  }

  static featherPx(width, height) {
    return RegionMaskPrep._scaled(width, height, RegionMaskPrep.FEATHER_SHARE, RegionMaskPrep.FEATHER_MIN_PX, RegionMaskPrep.FEATHER_MAX_PX);
  }

  static _scaled(width, height, share, min, max) {
    return Math.max(min, Math.min(max, Math.round(Math.max(width, height) * share)));
  }
}

module.exports = RegionMaskPrep;
