class EditRegionMask {
  static EDIT_THRESHOLD = 128;
  static BYTES_PER_PIXEL = 4;

  static fromBitmap({ width, height, data }) {
    const mask = EditRegionMask.blank(width, height);
    for (let i = 0, p = 0; i < mask.data.length; i++, p += EditRegionMask.BYTES_PER_PIXEL) mask.data[i] = data[p];
    return mask;
  }

  static blank(width, height, value = 0) {
    const data = new Uint8Array(Math.max(0, width * height));
    if (value) data.fill(value);
    return { width, height, data };
  }

  static coverage(mask) {
    if (!mask.data.length) return 0;
    let sum = 0;
    for (let i = 0; i < mask.data.length; i++) sum += mask.data[i];
    return sum / (mask.data.length * 255);
  }

  static isEmpty(mask) {
    for (let i = 0; i < mask.data.length; i++) if (mask.data[i] >= EditRegionMask.EDIT_THRESHOLD) return false;
    return true;
  }

  static bounds(mask) {
    let x0 = mask.width;
    let y0 = mask.height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < mask.height; y++) {
      for (let x = 0; x < mask.width; x++) {
        if (mask.data[y * mask.width + x] < EditRegionMask.EDIT_THRESHOLD) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  }

  static binarize(mask) {
    const out = EditRegionMask.blank(mask.width, mask.height);
    for (let i = 0; i < mask.data.length; i++) out.data[i] = mask.data[i] >= EditRegionMask.EDIT_THRESHOLD ? 255 : 0;
    return out;
  }

  static dilate(mask, radius) {
    const r = Math.max(0, Math.round(radius));
    if (!r) return { width: mask.width, height: mask.height, data: Uint8Array.from(mask.data) };
    return EditRegionMask._separable(mask, r, Math.max);
  }

  static feather(mask, radius) {
    const r = Math.max(0, Math.round(radius));
    if (!r) return { width: mask.width, height: mask.height, data: Uint8Array.from(mask.data) };
    return EditRegionMask._boxBlur(EditRegionMask._boxBlur(mask, r), r);
  }

  static resize(mask, width, height) {
    if (width === mask.width && height === mask.height) return { width, height, data: Uint8Array.from(mask.data) };
    const out = EditRegionMask.blank(width, height);
    const sx = mask.width / width;
    const sy = mask.height / height;
    for (let y = 0; y < height; y++) {
      const fy = Math.min(mask.height - 1, Math.max(0, (y + 0.5) * sy - 0.5));
      const y0 = Math.floor(fy);
      const y1 = Math.min(mask.height - 1, y0 + 1);
      const wy = fy - y0;
      for (let x = 0; x < width; x++) {
        const fx = Math.min(mask.width - 1, Math.max(0, (x + 0.5) * sx - 0.5));
        const x0 = Math.floor(fx);
        const x1 = Math.min(mask.width - 1, x0 + 1);
        const wx = fx - x0;
        const top = mask.data[y0 * mask.width + x0] * (1 - wx) + mask.data[y0 * mask.width + x1] * wx;
        const bottom = mask.data[y1 * mask.width + x0] * (1 - wx) + mask.data[y1 * mask.width + x1] * wx;
        out.data[y * width + x] = Math.round(top * (1 - wy) + bottom * wy);
      }
    }
    return out;
  }

  static crop(mask, rect) {
    const x0 = Math.max(0, rect.x);
    const y0 = Math.max(0, rect.y);
    const width = Math.max(0, Math.min(mask.width, rect.x + rect.width) - x0);
    const height = Math.max(0, Math.min(mask.height, rect.y + rect.height) - y0);
    const out = EditRegionMask.blank(width, height);
    for (let y = 0; y < height; y++) out.data.set(mask.data.subarray((y0 + y) * mask.width + x0, (y0 + y) * mask.width + x0 + width), y * width);
    return out;
  }

  static toBitmap(mask) {
    const data = Buffer.alloc(mask.data.length * EditRegionMask.BYTES_PER_PIXEL);
    for (let i = 0, p = 0; i < mask.data.length; i++, p += EditRegionMask.BYTES_PER_PIXEL) {
      const v = mask.data[i];
      data[p] = v;
      data[p + 1] = v;
      data[p + 2] = v;
      data[p + 3] = 255;
    }
    return { width: mask.width, height: mask.height, data };
  }

  static composite({ source, output, mask }) {
    EditRegionMask._requireSameSize(source, output, mask);
    const data = Buffer.alloc(source.data.length);
    for (let i = 0, p = 0; i < mask.data.length; i++, p += EditRegionMask.BYTES_PER_PIXEL) {
      const m = mask.data[i] / 255;
      for (let c = 0; c < 3; c++) data[p + c] = Math.round(source.data[p + c] + (output.data[p + c] - source.data[p + c]) * m);
      data[p + 3] = 255;
    }
    return { width: source.width, height: source.height, data };
  }

  static _requireSameSize(source, output, mask) {
    const same = (a) => a.width === source.width && a.height === source.height;
    if (!same(output) || !same(mask)) throw new Error('EditRegionMask.composite: source, output and mask must share one size');
  }

  static _separable(mask, r, pick) {
    const { width, height } = mask;
    const rows = EditRegionMask.blank(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let v = 0;
        for (let k = Math.max(0, x - r); k <= Math.min(width - 1, x + r); k++) v = pick(v, mask.data[y * width + k]);
        rows.data[y * width + x] = v;
      }
    }
    const out = EditRegionMask.blank(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let v = 0;
        for (let k = Math.max(0, y - r); k <= Math.min(height - 1, y + r); k++) v = pick(v, rows.data[k * width + x]);
        out.data[y * width + x] = v;
      }
    }
    return out;
  }

  static _boxBlur(mask, r) {
    const { width, height } = mask;
    const rows = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let n = 0;
        for (let k = Math.max(0, x - r); k <= Math.min(width - 1, x + r); k++) { sum += mask.data[y * width + k]; n++; }
        rows[y * width + x] = sum / n;
      }
    }
    const out = EditRegionMask.blank(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let n = 0;
        for (let k = Math.max(0, y - r); k <= Math.min(height - 1, y + r); k++) { sum += rows[k * width + x]; n++; }
        out.data[y * width + x] = Math.round(sum / n);
      }
    }
    return out;
  }
}

module.exports = EditRegionMask;
