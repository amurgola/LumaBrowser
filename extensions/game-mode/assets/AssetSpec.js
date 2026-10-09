const fs = require('fs');
const path = require('path');
const AssetPath = require('./AssetPath');
const AssetSizing = require('./AssetSizing');
const AssetStyle = require('./AssetStyle');
const PlaceholderPng = require('./PlaceholderPng');
const PixelPost = require('../pixel/PixelPost');

class AssetSpec {
  static prepare({ s, params, artStyle, native = null }) {
    if (!params || !params.prompt || !String(params.prompt).trim()) return { error: 'prompt is required' };
    const location = AssetPath.resolve(s.dir, params.path);
    if (location.error) return { error: location.error };
    const spec = AssetSpec._plan(location, params, artStyle, native);
    const written = AssetSpec._writePlaceholder(spec);
    return written.error ? written : spec;
  }

  static _plan(location, params, artStyle, native) {
    const canPost = PixelPost.available();
    const width = AssetSizing.clampDim(params.width);
    const height = AssetSizing.clampDim(params.height);
    const style = AssetSpec._style(params.style, artStyle);
    const isPixel = style.effective === 'pixel-art' && canPost;
    const scaleUp = canPost && (isPixel || Math.max(width, height) < AssetSizing.SMALL_ASSET_NATIVE);
    const grid = isPixel
      ? AssetSizing.pixelGridFor(width, height, params.pixelSize)
      : { logicalW: width, logicalH: height, pixelScale: 1 };
    const { genW, genH } = AssetSizing.genDimsFor(scaleUp, grid.logicalW, grid.logicalH, native);
    const wantAlpha = !!params.transparent && canPost;
    return {
      rel: location.rel, abs: location.abs, width, height, genW, genH,
      logicalW: grid.logicalW, logicalH: grid.logicalH, pixelScale: grid.pixelScale,
      isPixel,
      needsSmooth: !isPixel && (genW !== width || genH !== height),
      wantAlpha,
      alphaUnavailable: !!params.transparent && !canPost,
      styleNote: style.note,
      fullPrompt: AssetStyle.prompt(params.prompt, style.effective, wantAlpha),
    };
  }

  static _style(rawParam, artStyle) {
    const raw = rawParam ? String(rawParam) : '';
    const coerced = AssetStyle.normalize(raw);
    return {
      effective: coerced || AssetStyle.normalize(artStyle) || null,
      note: AssetStyle.noteFor(raw, coerced),
    };
  }

  static _writePlaceholder(spec) {
    try {
      fs.mkdirSync(path.dirname(spec.abs), { recursive: true });
      fs.writeFileSync(spec.abs, PlaceholderPng.solid(spec.width, spec.height, PlaceholderPng.colorFor(spec.rel)));
      return {};
    } catch (e) {
      return { error: `Could not write ${spec.rel}: ${e.message}` };
    }
  }
}

module.exports = AssetSpec;
