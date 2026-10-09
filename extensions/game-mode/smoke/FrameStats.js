class FrameStats {
  static BLACK_LUM = 24;
  static DARK_LUM = 48;
  static STEP = 3;
  static MAX_COLORS = 4096;

  static measure(bgra, width, height, rect) {
    const region = FrameStats._region(width, height, rect);
    const tally = { samples: 0, black: 0, dark: 0, lumSum: 0, colors: new Set() };
    for (let y = region.y0; y < region.y1; y += FrameStats.STEP) {
      for (let x = region.x0; x < region.x1; x += FrameStats.STEP) FrameStats._sample(tally, bgra, (y * width + x) * 4);
    }
    if (!tally.samples) return { samples: 0, blackFrac: 1, darkFrac: 1, meanLum: 0, colors: 0, verdict: 'empty' };
    return FrameStats._summary(tally);
  }

  static _region(width, height, rect) {
    return {
      x0: Math.max(0, Math.floor(rect ? rect.x : 0)),
      y0: Math.max(0, Math.floor(rect ? rect.y : 0)),
      x1: Math.min(width, Math.ceil(rect ? rect.x + rect.w : width)),
      y1: Math.min(height, Math.ceil(rect ? rect.y + rect.h : height)),
    };
  }

  static _sample(tally, bgra, i) {
    const b = bgra[i];
    const g = bgra[i + 1];
    const r = bgra[i + 2];
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    tally.samples++;
    if (lum < FrameStats.BLACK_LUM) tally.black++;
    if (lum < FrameStats.DARK_LUM) tally.dark++;
    tally.lumSum += lum;
    if (tally.colors.size < FrameStats.MAX_COLORS) tally.colors.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
  }

  static _summary(tally) {
    const blackFrac = tally.black / tally.samples;
    const darkFrac = tally.dark / tally.samples;
    const colors = tally.colors.size;
    return {
      samples: tally.samples,
      blackFrac: +blackFrac.toFixed(3),
      darkFrac: +darkFrac.toFixed(3),
      meanLum: Math.round(tally.lumSum / tally.samples),
      colors,
      verdict: FrameStats._verdict(blackFrac, darkFrac, colors),
    };
  }

  static _verdict(blackFrac, darkFrac, colors) {
    if (blackFrac > 0.97) return 'black';
    if (darkFrac > 0.97 && colors <= 12) return 'nearly-black';
    if (colors <= 6) return 'flat';
    return 'content';
  }
}

module.exports = FrameStats;
