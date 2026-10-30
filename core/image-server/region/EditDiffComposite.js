const EditRegionMask = require('./EditRegionMask');
const NativeBitmapCodec = require('./NativeBitmapCodec');
const RegionChangeSpread = require('./RegionChangeSpread');
const RegionMaskPrep = require('./RegionMaskPrep');

class EditDiffComposite {
  static MIME = 'image/png';
  static THRESHOLD = 40;
  static SPECKLE_PX = 1;
  static GLOBAL_SHARE = 0.35;

  static apply({ sourceBytes, outputBytes, codec = NativeBitmapCodec }) {
    let source = codec.decode(sourceBytes);
    let output = codec.decode(outputBytes);
    if (!source || !output) return null;
    const target = output.width * output.height > source.width * source.height ? output : source;
    const outputResized = output.width !== target.width || output.height !== target.height;
    if (source.width !== target.width || source.height !== target.height) source = codec.resize(source, target.width, target.height);
    if (outputResized) output = codec.resize(output, target.width, target.height);
    if (!source || !output) return null;
    const { width, height } = target;
    const changed = EditDiffComposite.open(RegionChangeSpread.changed(source, output, EditDiffComposite.THRESHOLD), EditDiffComposite.SPECKLE_PX);
    const share = EditRegionMask.coverage(changed);
    if (share >= EditDiffComposite.GLOBAL_SHARE) {
      const bytes = outputResized ? codec.encodePng(output) : outputBytes;
      return bytes ? { bytes, mime: EditDiffComposite.MIME, width, height, share, global: true, composited: false } : null;
    }
    const grown = EditRegionMask.dilate(changed, RegionMaskPrep.growPx(width, height));
    const blend = EditRegionMask.feather(grown, RegionMaskPrep.featherPx(width, height));
    const bytes = codec.encodePng(EditRegionMask.composite({ source, output, mask: blend }));
    return bytes ? { bytes, mime: EditDiffComposite.MIME, width, height, share, global: false, composited: true } : null;
  }

  static open(mask, r) {
    if (!(r > 0)) return mask;
    const eroded = EditDiffComposite.invert(EditRegionMask.dilate(EditDiffComposite.invert(mask), r));
    return EditRegionMask.dilate(eroded, r);
  }

  static invert(mask) {
    const out = EditRegionMask.blank(mask.width, mask.height);
    for (let i = 0; i < mask.data.length; i++) out.data[i] = 255 - mask.data[i];
    return out;
  }
}

module.exports = EditDiffComposite;
