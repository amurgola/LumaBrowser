class FrameHash {
  static GRID_W = 32;
  static GRID_H = 18;
  static COLOR_W = 16;
  static COLOR_H = 9;
  static DEAD_BAND = 0.5;
  static COLOR_MIN_LEVELS = 2;
  static COLOR_CELL_WEIGHT = 4;
  static SAMPLES_PER_CELL = 8;
  static POP4 = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
  static LENGTH_ERROR = 'hamming: hashes must be hex strings of equal length';

  static dHash(shot, { w = FrameHash.GRID_W, h = FrameHash.GRID_H } = {}) {
    const gray = FrameHash.downscaleGray(shot, w + 1, h);
    const bits = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const row = y * (w + 1) + x;
        bits.push(gray[row + 1] - gray[row] > FrameHash.DEAD_BAND ? 1 : 0);
      }
    }
    return FrameHash._bitsToHex(bits);
  }

  static colorGrid(shot, { w = FrameHash.COLOR_W, h = FrameHash.COLOR_H } = {}) {
    const sums = new Float64Array(w * h * 3);
    const counts = FrameHash._sampleCells(shot, w, h, (cell, bgra, i) => {
      sums[cell * 3] += bgra[i + 2];
      sums[cell * 3 + 1] += bgra[i + 1];
      sums[cell * 3 + 2] += bgra[i];
    });
    let hex = '';
    for (let c = 0; c < w * h; c++) {
      for (let k = 0; k < 3; k++) {
        const mean = counts[c] ? sums[c * 3 + k] / counts[c] : 0;
        hex += Math.min(7, Math.floor(mean / 32)).toString(16);
      }
    }
    return hex;
  }

  static frameSignature(shot) {
    return `${FrameHash.dHash(shot)}.${FrameHash.colorGrid(shot)}`;
  }

  static hamming(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') throw new Error(FrameHash.LENGTH_ERROR);
    const [hashA, colorA] = a.split('.');
    const [hashB, colorB] = b.split('.');
    let distance = FrameHash._dHashDistance(hashA, hashB);
    if (colorA != null && colorB != null) distance += FrameHash._colorDistance(colorA, colorB);
    return distance;
  }

  static downscaleGray(shot, w, h) {
    const sum = new Float64Array(w * h);
    const counts = FrameHash._sampleCells(shot, w, h, (cell, bgra, i) => {
      sum[cell] += 0.114 * bgra[i] + 0.587 * bgra[i + 1] + 0.299 * bgra[i + 2];
    });
    for (let i = 0; i < sum.length; i++) sum[i] = counts[i] ? sum[i] / counts[i] : 0;
    return sum;
  }

  static _sampleCells(shot, w, h, addPixel) {
    const { width, height, bgra } = shot;
    if (!(width > 0 && height > 0)) throw new Error('frameHash: empty frame');
    const counts = new Uint32Array(w * h);
    const step = Math.max(1, Math.floor(Math.min(width / w, height / h) / FrameHash.SAMPLES_PER_CELL));
    for (let y = 0; y < height; y += step) {
      const cy = Math.min(h - 1, Math.floor((y * h) / height));
      const row = y * width * 4;
      for (let x = 0; x < width; x += step) {
        const cell = cy * w + Math.min(w - 1, Math.floor((x * w) / width));
        addPixel(cell, bgra, row + x * 4);
        counts[cell] += 1;
      }
    }
    return counts;
  }

  static _bitsToHex(bits) {
    let hex = '';
    for (let i = 0; i < bits.length; i += 4) {
      hex += ((bits[i] << 3) | ((bits[i + 1] || 0) << 2) | ((bits[i + 2] || 0) << 1) | (bits[i + 3] || 0)).toString(16);
    }
    return hex;
  }

  static _dHashDistance(a, b) {
    if (a.length !== b.length) throw new Error(FrameHash.LENGTH_ERROR);
    let d = 0;
    for (let i = 0; i < a.length; i++) d += FrameHash.POP4[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
    return d;
  }

  static _colorDistance(a, b) {
    if (a.length !== b.length) throw new Error('hamming: colour grids differ in size');
    let cells = 0;
    for (let i = 0; i < a.length; i += 3) {
      if (FrameHash._cellChanged(a, b, i)) cells += 1;
    }
    return cells * FrameHash.COLOR_CELL_WEIGHT;
  }

  static _cellChanged(a, b, i) {
    for (let k = 0; k < 3; k++) {
      if (Math.abs(parseInt(a[i + k], 16) - parseInt(b[i + k], 16)) >= FrameHash.COLOR_MIN_LEVELS) return true;
    }
    return false;
  }
}

module.exports = FrameHash;
