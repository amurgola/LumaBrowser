import RegionMaskData from './RegionMaskData.js';

export default class RegionFill {
  static flood(imageData, x, y, rgba) {
    const { width, height, data } = imageData;
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    if (!(sx >= 0 && sy >= 0 && sx < width && sy < height)) return 0;
    const painted = (i) => data[i * 4 + 3] >= RegionMaskData.PAINTED_ALPHA;
    const start = sy * width + sx;
    if (painted(start)) return 0;
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;
    let count = 0;
    const take = (i) => {
      if (painted(i)) return;
      const p = i * 4;
      data[p] = rgba[0];
      data[p + 1] = rgba[1];
      data[p + 2] = rgba[2];
      data[p + 3] = rgba[3];
      queue[tail++] = i;
      count++;
    };
    take(start);
    while (head < tail) {
      const i = queue[head++];
      const px = i % width;
      if (px > 0) take(i - 1);
      if (px < width - 1) take(i + 1);
      if (i >= width) take(i - width);
      if (i + width < width * height) take(i + width);
    }
    return count;
  }

  static invert(imageData, rgba) {
    const { data } = imageData;
    for (let p = 0; p < data.length; p += 4) {
      if (data[p + 3] >= RegionMaskData.PAINTED_ALPHA) {
        data[p] = 0; data[p + 1] = 0; data[p + 2] = 0; data[p + 3] = 0;
      } else {
        data[p] = rgba[0]; data[p + 1] = rgba[1]; data[p + 2] = rgba[2]; data[p + 3] = rgba[3];
      }
    }
    return imageData;
  }

  static measure(imageData) {
    const { width, height, data } = imageData;
    const pixels = width * height;
    if (!pixels) return { coverage: 0, bounds: null };
    let painted = 0;
    let x0 = width;
    let y0 = height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0, i = 3; y < height; y++) {
      for (let x = 0; x < width; x++, i += 4) {
        if (data[i] < RegionMaskData.PAINTED_ALPHA) continue;
        painted++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { coverage: painted / pixels, bounds: x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } };
  }
}
