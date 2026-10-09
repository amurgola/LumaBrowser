class EditFrames {
  static ASPECTS = {
    match: null,
    square: [1, 1],
    portrait: [3, 4],
    landscape: [4, 3],
    tall: [9, 16],
    wide: [16, 9],
  };

  static USES = {
    match: 'same shape as the source; retouch, recolor, swap or add a detail (the default)',
    square: '1:1; icons, avatars, album art',
    portrait: '3:4; head-and-shoulders, a single product',
    landscape: '4:3; a scene or group, a room',
    tall: '9:16; a FULL-BODY standing figure, a phone wallpaper',
    wide: '16:9; cinematic, a banner, widening a scene',
  };

  static NAMES = Object.keys(EditFrames.ASPECTS);

  static DEFAULT_GRID = 64;
  static DEFAULT_NATIVE_SIDE = 1024;
  static MATCH_MIN_AREA_FRACTION = 0.25;
  static MATCH_MAX_AREA_FRACTION = 1.2;

  static sizeForAspect(aspect, area, grid) {
    const [aw, ah] = aspect;
    const width = Math.sqrt(area * aw / ah);
    const height = width * ah / aw;
    return { width: EditFrames._alignNearest(width, grid), height: EditFrames._alignNearest(height, grid) };
  }

  static resolveFrame({ frame, srcDims, native, grid = EditFrames.DEFAULT_GRID } = {}) {
    const g = Number(grid) > 1 ? Number(grid) : EditFrames.DEFAULT_GRID;
    const nativeSize = EditFrames._nativeSize(native);
    const name = EditFrames.NAMES.includes(frame) ? frame : 'match';
    if (name !== 'match') {
      const area = nativeSize.width * nativeSize.height;
      return { ...EditFrames.sizeForAspect(EditFrames.ASPECTS[name], area, g), frame: name, scaled: false };
    }
    return EditFrames._resolveMatch(srcDims, nativeSize, g);
  }

  static listFrames({ native, grid = EditFrames.DEFAULT_GRID } = {}) {
    return EditFrames.NAMES.map((frame) => {
      const use = EditFrames.USES[frame];
      if (frame === 'match') return { frame, width: null, height: null, use };
      const size = EditFrames.resolveFrame({ frame, native, grid });
      return { frame, width: size.width, height: size.height, use };
    });
  }

  static _resolveMatch(srcDims, nativeSize, grid) {
    const sw = Number(srcDims && srcDims.width);
    const sh = Number(srcDims && srcDims.height);
    if (!(sw > 0 && sh > 0)) return EditFrames._nativeCanvas(nativeSize, grid);
    const nativeArea = nativeSize.width * nativeSize.height;
    const srcArea = sw * sh;
    const outOfBand = srcArea < nativeArea * EditFrames.MATCH_MIN_AREA_FRACTION
      || srcArea > nativeArea * EditFrames.MATCH_MAX_AREA_FRACTION;
    const targetArea = outOfBand ? nativeArea : srcArea;
    return { ...EditFrames.sizeForAspect([sw, sh], targetArea, grid), frame: 'match', scaled: outOfBand };
  }

  static _nativeCanvas(nativeSize, grid) {
    return {
      width: EditFrames._alignNearest(nativeSize.width, grid),
      height: EditFrames._alignNearest(nativeSize.height, grid),
      frame: 'match',
      scaled: false,
    };
  }

  static _nativeSize(native) {
    const width = Number(native && native.width);
    const height = Number(native && native.height);
    return {
      width: width > 0 ? width : EditFrames.DEFAULT_NATIVE_SIDE,
      height: height > 0 ? height : EditFrames.DEFAULT_NATIVE_SIDE,
    };
  }

  static _alignNearest(n, grid) {
    return Math.max(grid, Math.round(n / grid) * grid);
  }
}

module.exports = EditFrames;
