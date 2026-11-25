const AssetSizing = require('./AssetSizing');
const AssetStyle = require('./AssetStyle');
const RdFlowAssets = require('./RdFlowAssets');
const PixelPost = require('../pixel/PixelPost');

class ImageModelPins {
  static SPRITE_PREFERRED = ['rd-flow-64', 'chroma1-flash', 'chroma1-hd'];
  static BACKDROP_PREFERRED = ['chroma1-hd', 'chroma1-flash'];
  static SPRITE_MAX_SIDE = 256;

  static resolve(data) {
    const d = data || {};
    const one = d.imageModel ? String(d.imageModel) : null;
    return {
      sprite: d.spriteModel ? String(d.spriteModel) : one,
      backdrop: d.backdropModel ? String(d.backdropModel) : one,
    };
  }

  static normalize(ref) {
    if (ref && typeof ref === 'object') {
      return { sprite: ref.sprite ? String(ref.sprite) : null, backdrop: ref.backdrop ? String(ref.backdrop) : null };
    }
    const one = ref ? String(ref) : null;
    return { sprite: one, backdrop: one };
  }

  static describe(params, artStyle) {
    const p = params || {};
    const width = AssetSizing.clampDim(p.width);
    const height = AssetSizing.clampDim(p.height);
    const style = AssetStyle.normalize(p.style ? String(p.style) : '') || AssetStyle.normalize(artStyle);
    const grid = AssetSizing.pixelGridFor(width, height, p.pixelSize);
    return {
      width, height, transparent: !!p.transparent,
      pixel: style === 'pixel-art' && PixelPost.available(),
      gridW: grid.logicalW, gridH: grid.logicalH,
    };
  }

  static roleOf({ width, height, transparent }) {
    if (transparent) return 'sprite';
    const longSide = Math.max(Number(width) || 0, Number(height) || 0);
    return longSide < ImageModelPins.SPRITE_MAX_SIDE ? 'sprite' : 'backdrop';
  }

  static modelFor(asset, pins) {
    const p = pins || { sprite: null, backdrop: null };
    const a = asset || {};
    const order = ImageModelPins.roleOf(a) === 'sprite' ? [p.sprite, p.backdrop] : [p.backdrop, p.sprite];
    return order.find((ref) => ref && (!RdFlowAssets.isModel(ref) || RdFlowAssets.canDraw(a))) || undefined;
  }

  static orderSpecs(specs, pins) {
    const list = Array.isArray(specs) ? specs : [];
    const order = ImageModelPins._modelOrder(list, pins);
    return list
      .map((spec, index) => ({ spec, index, rank: order.indexOf(ImageModelPins._modelKey(spec)) }))
      .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
      .map((entry) => entry.spec);
  }

  static defaults(installedIds) {
    const have = new Set((installedIds || []).map(String));
    const first = (list) => list.find((id) => have.has(id)) || '';
    return { spriteModel: first(ImageModelPins.SPRITE_PREFERRED), backdropModel: first(ImageModelPins.BACKDROP_PREFERRED) };
  }

  static _modelOrder(list, pins) {
    const order = [];
    if (pins && pins.sprite) order.push(pins.sprite);
    if (pins && pins.backdrop && !order.includes(pins.backdrop)) order.push(pins.backdrop);
    for (const spec of list) {
      const key = ImageModelPins._modelKey(spec);
      if (!order.includes(key)) order.push(key);
    }
    return order;
  }

  static _modelKey(spec) {
    return spec && spec.modelRef ? String(spec.modelRef) : '';
  }
}

module.exports = ImageModelPins;
