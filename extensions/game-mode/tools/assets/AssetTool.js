const GameTool = require('../GameTool');
const AssetSizing = require('../../assets/AssetSizing');
const ImageModelPins = require('../../assets/ImageModelPins');

class AssetTool extends GameTool {
  static ASSET_PROPS = {
    path: { type: 'string', description: 'Relative path under assets/, e.g. assets/player.png' },
    prompt: { type: 'string', description: 'What the image should show, concretely' },
    width: { type: 'number', description: `Pixels (default 256, clamped ${AssetSizing.MIN_ASSET_DIM}-${AssetSizing.MAX_ASSET_DIM}, snapped to 8)` },
    height: { type: 'number', description: `Pixels (default 256, clamped ${AssetSizing.MIN_ASSET_DIM}-${AssetSizing.MAX_ASSET_DIM}, snapped to 8)` },
    style: { type: 'string', enum: ['pixel-art', 'cartoon', 'painted', 'flat'], description: 'Art style' },
    pixelSize: {
      type: 'number',
      description: 'pixel-art only: how many file pixels one logical pixel spans (1-'
        + `${AssetSizing.MAX_PIXEL_SIZE}). Default: 1 for assets up to ${AssetSizing.LOGICAL_PIXEL_MAX}px, otherwise the smallest `
        + `scale that keeps the grid at or under ${AssetSizing.LOGICAL_PIXEL_MAX}px. Set it explicitly to keep the `
        + 'same chunkiness across sprites and backdrops (e.g. a 512x512 backdrop with pixelSize 4 '
        + 'matches 64x64 sprites drawn at 4x zoom).',
    },
    transparent: {
      type: 'boolean',
      description: 'Remove the background so the asset has real transparency. Use for sprites; '
        + 'never for full-canvas backdrops. Default false.',
    },
  };

  constructor(scope, { artStyle = null, imageModelRef = null } = {}) {
    super(scope);
    this._artStyle = artStyle;
    this._pins = ImageModelPins.normalize(imageModelRef);
  }

  _modelFor(params) {
    return ImageModelPins.modelFor({
      width: AssetSizing.clampDim(params && params.width),
      height: AssetSizing.clampDim(params && params.height),
      transparent: !!(params && params.transparent),
    }, this._pins);
  }
}

module.exports = AssetTool;
