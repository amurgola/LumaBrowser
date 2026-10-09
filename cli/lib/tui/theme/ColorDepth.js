class ColorDepth {
  static CUBE = [0, 95, 135, 175, 215, 255];

  static detect(stream, env = process.env) {
    if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return 1;
    if (env.LUMA_CLI_COLOR === '0') return 1;
    if (env.FORCE_COLOR === '0') return 1;
    if (env.FORCE_COLOR === '3' || env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') return 24;
    if (env.FORCE_COLOR === '2') return 8;
    if (env.FORCE_COLOR === '1') return 4;
    if (stream && typeof stream.getColorDepth === 'function') {
      try { return stream.getColorDepth(env); } catch (_) {}
    }
    return stream && stream.isTTY ? 8 : 1;
  }

  static hexToRgb(hex) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  static rgbTo256({ r, g, b }) {
    const rgb = { r, g, b };
    const ci = ColorDepth._nearestCube(r); const cj = ColorDepth._nearestCube(g); const ck = ColorDepth._nearestCube(b);
    const cube = { r: ColorDepth.CUBE[ci], g: ColorDepth.CUBE[cj], b: ColorDepth.CUBE[ck] };
    const grayLevel = Math.max(0, Math.min(23, Math.round(((r + g + b) / 3 - 8) / 10)));
    const gv = 8 + grayLevel * 10;
    const gray = { r: gv, g: gv, b: gv };
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    if (spread < 10 && ColorDepth._dist(gray, rgb) < ColorDepth._dist(cube, rgb)) return 232 + grayLevel;
    return 16 + ci * 36 + cj * 6 + ck;
  }

  static _nearestCube(v) {
    let best = 0;
    for (let i = 1; i < ColorDepth.CUBE.length; i++) {
      if (Math.abs(ColorDepth.CUBE[i] - v) < Math.abs(ColorDepth.CUBE[best] - v)) best = i;
    }
    return best;
  }

  static _dist(a, b) {
    const dr = a.r - b.r; const dg = a.g - b.g; const db = a.b - b.b;
    return dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
  }
}

module.exports = ColorDepth;
