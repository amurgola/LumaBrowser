class FitVramMath {
  static GB = 1024 * 1024 * 1024;

  static GPU_OVERHEAD = 1 * FitVramMath.GB;

  static Q8_KV_FRACTION = 0.55;

  static kvBytes(paramsB, ctx, kvType) {
    const f16 = (paramsB / 7) * (ctx / 32768) * 2 * FitVramMath.GB;
    return kvType === 'q8_0' ? f16 * FitVramMath.Q8_KV_FRACTION : f16;
  }

  static kvBytesAt8k(paramsB) {
    return FitVramMath.kvBytes(Number(paramsB) || 7, 8192, 'f16');
  }
}

module.exports = FitVramMath;
