const ColorMath = require('./ColorMath');

class KCentroid {
  static ITERATIONS = 4;

  static downscale(src, sw, sh, outW, outH) {
    const out = new Uint8ClampedArray(outW * outH * 4);
    for (let oy = 0; oy < outH; oy++) {
      for (let ox = 0; ox < outW; ox++) {
        const cell = KCentroid._gatherCell(src, sw, KCentroid._span(oy, sh, outH), KCentroid._span(ox, sw, outW));
        if (cell.transparent * 2 > cell.total || !cell.pixels.length) continue;
        KCentroid._write(out, (oy * outW + ox) * 4, KCentroid._dominant(cell));
      }
    }
    return out;
  }

  static _span(o, size, outSize) {
    const start = Math.floor((o * size) / outSize);
    return [start, Math.max(start + 1, Math.floor(((o + 1) * size) / outSize))];
  }

  static _gatherCell(src, sw, [y0, y1], [x0, x1]) {
    const cell = { pixels: [], transparent: 0, total: 0, dark: null, light: null, darkLum: Infinity, lightLum: -Infinity };
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) KCentroid._addPixel(cell, src, (y * sw + x) * 4);
    }
    return cell;
  }

  static _addPixel(cell, src, i) {
    cell.total++;
    if (src[i + 3] < 128) { cell.transparent++; return; }
    const p = [src[i], src[i + 1], src[i + 2]];
    cell.pixels.push(p);
    const lum = ColorMath.luminance(p[0], p[1], p[2]);
    if (lum < cell.darkLum) { cell.darkLum = lum; cell.dark = p; }
    if (lum > cell.lightLum) { cell.lightLum = lum; cell.light = p; }
  }

  static _dominant(cell) {
    if (cell.pixels.length === 1 || cell.darkLum === cell.lightLum) return cell.pixels[0];
    let c0 = cell.dark.slice();
    let c1 = cell.light.slice();
    let n0 = 0;
    let n1 = 0;
    for (let it = 0; it < KCentroid.ITERATIONS; it++) {
      const s0 = [0, 0, 0];
      const s1 = [0, 0, 0];
      n0 = 0; n1 = 0;
      for (const p of cell.pixels) {
        if (ColorMath.dist2(p, c0) <= ColorMath.dist2(p, c1)) { KCentroid._accumulate(s0, p); n0++; } else { KCentroid._accumulate(s1, p); n1++; }
      }
      if (n0) c0 = [s0[0] / n0, s0[1] / n0, s0[2] / n0];
      if (n1) c1 = [s1[0] / n1, s1[1] / n1, s1[2] / n1];
    }
    return n0 >= n1 ? c0 : c1;
  }

  static _accumulate(sum, p) {
    sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2];
  }

  static _write(out, o, color) {
    out[o] = Math.round(color[0]);
    out[o + 1] = Math.round(color[1]);
    out[o + 2] = Math.round(color[2]);
    out[o + 3] = 255;
  }
}

module.exports = KCentroid;
