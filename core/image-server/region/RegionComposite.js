const EditRegionMask = require('./EditRegionMask');
const NativeBitmapCodec = require('./NativeBitmapCodec');
const RegionChangeSpread = require('./RegionChangeSpread');
const RegionCrop = require('./RegionCrop');

class RegionComposite {
  static MIME = 'image/png';

  static apply({ sourceBytes, outputBytes, grown, featherPx = 0, rect = null, codec = NativeBitmapCodec }) {
    const source = codec.decode(sourceBytes);
    let output = codec.decode(outputBytes);
    if (!source || !output || !grown) return null;
    if (source.width !== grown.width || source.height !== grown.height) return null;
    if (rect && (rect.x + rect.width > source.width || rect.y + rect.height > source.height)) return null;
    const area = rect ? RegionCrop.cut(source, rect) : source;
    const mask = rect ? EditRegionMask.crop(grown, rect) : grown;
    if (output.width !== area.width || output.height !== area.height) output = codec.resize(output, area.width, area.height);
    if (!output) return null;
    const blend = EditRegionMask.feather(RegionComposite.followed(area, output, mask), featherPx);
    const patch = EditRegionMask.composite({ source: area, output, mask: blend });
    const bytes = codec.encodePng(rect ? RegionCrop.paste(source, patch, rect) : patch);
    return bytes ? { bytes, mime: RegionComposite.MIME, width: source.width, height: source.height } : null;
  }

  static followed(area, output, mask) {
    const changed = RegionChangeSpread.changed(area, output);
    return RegionChangeSpread.spread(mask, changed, RegionChangeSpread.capPx(area.width, area.height));
  }
}

module.exports = RegionComposite;
