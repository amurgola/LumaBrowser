class HotswapRamGate {
  static GB = 1024 * 1024 * 1024;
  static RESERVE_FLOOR_BYTES = 16 * HotswapRamGate.GB;
  static RESERVE_FRACTION = 0.15;

  static ramReserveBytes(ramTotalBytes) {
    const fractional = Math.floor((ramTotalBytes || 0) * HotswapRamGate.RESERVE_FRACTION);
    return Math.max(HotswapRamGate.RESERVE_FLOOR_BYTES, fractional);
  }

  static evaluate({ ramTotalBytes, poolBytes: sizes, inFlightCopy = true }) {
    const list = HotswapRamGate._normalizeSizes(sizes);
    const poolBytes = list.reduce((sum, b) => sum + b, 0);
    const largest = list.length ? Math.max(0, ...list) : 0;
    const reserveBytes = HotswapRamGate.ramReserveBytes(ramTotalBytes);
    const requiredBytes = poolBytes + (inFlightCopy ? 2 * largest : 0) + reserveBytes;
    const viable = (ramTotalBytes || 0) >= requiredBytes;
    return { poolBytes, largest, reserveBytes, requiredBytes, viable };
  }

  static _normalizeSizes(sizes) {
    return (Array.isArray(sizes) ? sizes : []).map((b) => b || 0);
  }
}

module.exports = HotswapRamGate;
