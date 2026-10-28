const EditRegionMask = require('./EditRegionMask');

class RegionChangeSpread {
  static BYTES_PER_PIXEL = 4;
  static THRESHOLD = 48;
  static CAP_SHARE = 0.08;
  static CAP_MIN_PX = 12;
  static CAP_MAX_PX = 120;

  static changed(source, output, threshold = RegionChangeSpread.THRESHOLD) {
    const mask = EditRegionMask.blank(source.width, source.height);
    const bpp = RegionChangeSpread.BYTES_PER_PIXEL;
    for (let i = 0, p = 0; i < mask.data.length; i++, p += bpp) {
      for (let c = 0; c < 3; c++) {
        if (Math.abs(source.data[p + c] - output.data[p + c]) > threshold) { mask.data[i] = 255; break; }
      }
    }
    return mask;
  }

  static spread(grown, changed, cap) {
    const { width, height } = grown;
    const n = width * height;
    const out = EditRegionMask.blank(width, height);
    const dist = new Int32Array(n).fill(-1);
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < n; i++) {
      if (grown.data[i] >= EditRegionMask.EDIT_THRESHOLD) { out.data[i] = 255; dist[i] = 0; queue[tail++] = i; }
    }
    const limit = Math.max(0, Math.round(cap));
    const visit = (j, d) => {
      if (dist[j] !== -1 || changed.data[j] < EditRegionMask.EDIT_THRESHOLD) return;
      dist[j] = d;
      out.data[j] = 255;
      queue[tail++] = j;
    };
    while (head < tail) {
      const i = queue[head++];
      const d = dist[i];
      if (d >= limit) continue;
      const x = i % width;
      const y = (i - x) / width;
      if (x > 0) visit(i - 1, d + 1);
      if (x < width - 1) visit(i + 1, d + 1);
      if (y > 0) visit(i - width, d + 1);
      if (y < height - 1) visit(i + width, d + 1);
    }
    return out;
  }

  static capPx(width, height) {
    const raw = Math.round(Math.max(width, height) * RegionChangeSpread.CAP_SHARE);
    return Math.max(RegionChangeSpread.CAP_MIN_PX, Math.min(RegionChangeSpread.CAP_MAX_PX, raw));
  }
}

module.exports = RegionChangeSpread;
