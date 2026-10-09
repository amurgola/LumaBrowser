class NearestUpscale {
  static apply(src, sw, sh, outW, outH) {
    const out = new Uint8ClampedArray(outW * outH * 4);
    for (let oy = 0; oy < outH; oy++) {
      const sy = Math.min(sh - 1, Math.floor((oy * sh) / outH));
      for (let ox = 0; ox < outW; ox++) {
        const sx = Math.min(sw - 1, Math.floor((ox * sw) / outW));
        NearestUpscale._copy(src, (sy * sw + sx) * 4, out, (oy * outW + ox) * 4);
      }
    }
    return out;
  }

  static _copy(src, i, out, o) {
    out[o] = src[i];
    out[o + 1] = src[i + 1];
    out[o + 2] = src[i + 2];
    out[o + 3] = src[i + 3];
  }
}

module.exports = NearestUpscale;
