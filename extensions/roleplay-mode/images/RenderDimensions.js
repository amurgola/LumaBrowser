const ImageProfiles = require('./ImageProfiles');

class RenderDimensions {
  static DEFAULTS = Object.freeze({
    portrait: { width: 512, height: 512 },
    scene: { width: 768, height: 512 },
    composite: { width: 768, height: 1152 },
    reaction: { width: 768, height: 1024 },
    reactionFull: { width: 832, height: 1216 },
  });
  static FALLBACK_SIDE = 512;

  static resolve(data, type, defW, defH) {
    const def = RenderDimensions.DEFAULTS[type] || {};
    const dW = Number(defW) > 0 ? Math.round(Number(defW)) : (def.width || RenderDimensions.FALLBACK_SIDE);
    const dH = Number(defH) > 0 ? Math.round(Number(defH)) : (def.height || RenderDimensions.FALLBACK_SIDE);
    return ImageProfiles.dimensionsFor(data, type, dW, dH);
  }

  static reaction(data, shot) {
    return shot === 'full'
      ? RenderDimensions.resolve(data, 'reactionFull', 832, 1216)
      : RenderDimensions.resolve(data, 'reaction', 768, 1024);
  }
}

module.exports = RenderDimensions;
