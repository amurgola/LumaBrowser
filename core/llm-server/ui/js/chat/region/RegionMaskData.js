export default class RegionMaskData {
  static PAINTED_ALPHA = 128;
  static MASK_THRESHOLD = 128;

  static coverage(imageData) {
    const { data } = imageData;
    const pixels = data.length / 4;
    if (!pixels) return 0;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= RegionMaskData.PAINTED_ALPHA) painted++;
    return painted / pixels;
  }

  static isBlank(imageData) {
    const { data } = imageData;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= RegionMaskData.PAINTED_ALPHA) return false;
    return true;
  }

  static bounds(imageData) {
    const { width, height, data } = imageData;
    let x0 = width;
    let y0 = height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] < RegionMaskData.PAINTED_ALPHA) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  }

  static maskPixels(imageData) {
    const { data } = imageData;
    const out = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i + 3] >= RegionMaskData.PAINTED_ALPHA ? 255 : 0;
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
    return out;
  }

  static paintPixels(maskImageData, rgba) {
    const { data } = maskImageData;
    const out = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < RegionMaskData.MASK_THRESHOLD) continue;
      out[i] = rgba[0];
      out[i + 1] = rgba[1];
      out[i + 2] = rgba[2];
      out[i + 3] = rgba[3];
    }
    return out;
  }
}
