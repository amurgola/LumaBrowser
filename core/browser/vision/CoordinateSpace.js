class CoordinateSpace {
  static COORD_FORMATS = Object.freeze({
    pixels: { kind: 'pixels' },
    norm1000: { kind: 'normalized', scale: 1000 },
    norm999: { kind: 'normalized', scale: 999 },
    norm1: { kind: 'normalized', scale: 1 },
  });

  static frameScale(frame) {
    CoordinateSpace._assertFrame(frame);
    return frame.imageWidth / frame.cssWidth;
  }

  static imageToCss(point, frame) {
    CoordinateSpace._assertFrame(frame);
    return {
      x: point.x * (frame.cssWidth / frame.imageWidth),
      y: point.y * (frame.cssHeight / frame.imageHeight),
    };
  }

  static cssToImage(point, frame) {
    CoordinateSpace._assertFrame(frame);
    return {
      x: point.x * (frame.imageWidth / frame.cssWidth),
      y: point.y * (frame.imageHeight / frame.cssHeight),
    };
  }

  static modelToSent(point, format, sent) {
    const coordFormat = CoordinateSpace._formatOf(format);
    if (!CoordinateSpace._isFinite(point.x) || !CoordinateSpace._isFinite(point.y)) {
      throw new Error('coordinateSpace: point is not numeric');
    }
    if (coordFormat.kind === 'pixels') return { x: point.x, y: point.y };
    return {
      x: (point.x / coordFormat.scale) * sent.width,
      y: (point.y / coordFormat.scale) * sent.height,
    };
  }

  static sentToModel(point, format, sent) {
    const coordFormat = CoordinateSpace._formatOf(format);
    if (coordFormat.kind === 'pixels') return { x: point.x, y: point.y };
    return {
      x: (point.x / sent.width) * coordFormat.scale,
      y: (point.y / sent.height) * coordFormat.scale,
    };
  }

  static smartResize(width, height, { factor = 32, minPixels = 4 * 32 * 32, maxPixels = 16384 * 32 * 32 } = {}) {
    CoordinateSpace._assertResizable(width, height);
    const rounded = CoordinateSpace._roundToFactor(width, height, factor);
    if (rounded.width * rounded.height > maxPixels) {
      return CoordinateSpace._shrinkToBudget(width, height, factor, maxPixels);
    }
    if (rounded.width * rounded.height < minPixels) {
      return CoordinateSpace._growToFloor(width, height, factor, minPixels);
    }
    return rounded;
  }

  static clampPoint(point, width, height) {
    return {
      x: Math.min(Math.max(point.x, 0), Math.max(0, width - 1)),
      y: Math.min(Math.max(point.y, 0), Math.max(0, height - 1)),
    };
  }

  static pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width
      && point.y >= rect.y && point.y <= rect.y + rect.height;
  }

  static zoomWindow(point, width, height, { fraction = 0.5, minSize = 512 } = {}) {
    const windowWidth = Math.min(width, Math.max(Math.round(width * fraction), minSize));
    const windowHeight = Math.min(height, Math.max(Math.round(height * fraction), minSize));
    return {
      x: Math.round(CoordinateSpace._clamp(point.x - windowWidth / 2, 0, width - windowWidth)),
      y: Math.round(CoordinateSpace._clamp(point.y - windowHeight / 2, 0, height - windowHeight)),
      width: windowWidth,
      height: windowHeight,
    };
  }

  static _formatOf(format) {
    const coordFormat = CoordinateSpace.COORD_FORMATS[format];
    if (!coordFormat) throw new Error(`coordinateSpace: unknown coordinate format "${format}"`);
    return coordFormat;
  }

  static _assertFrame(frame) {
    if (!frame || !(frame.imageWidth > 0) || !(frame.imageHeight > 0)
      || !(frame.cssWidth > 0) || !(frame.cssHeight > 0)) {
      throw new Error('coordinateSpace: frame needs positive imageWidth/imageHeight/cssWidth/cssHeight');
    }
  }

  static _assertResizable(width, height) {
    if (!(width > 0) || !(height > 0)) throw new Error('smartResize: width/height must be positive');
    if (Math.max(width, height) / Math.min(width, height) > 200) {
      throw new Error('smartResize: aspect ratio must be under 200');
    }
  }

  static _roundToFactor(width, height, factor) {
    return {
      width: Math.max(factor, Math.round(width / factor) * factor),
      height: Math.max(factor, Math.round(height / factor) * factor),
    };
  }

  static _shrinkToBudget(width, height, factor, maxPixels) {
    const beta = Math.sqrt((height * width) / maxPixels);
    return {
      width: Math.max(factor, Math.floor(width / beta / factor) * factor),
      height: Math.max(factor, Math.floor(height / beta / factor) * factor),
    };
  }

  static _growToFloor(width, height, factor, minPixels) {
    const beta = Math.sqrt(minPixels / (height * width));
    return {
      width: Math.ceil((width * beta) / factor) * factor,
      height: Math.ceil((height * beta) / factor) * factor,
    };
  }

  static _clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static _isFinite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }
}

module.exports = CoordinateSpace;
