class PcmSamples {
  static floatToInt16Bytes(f32) {
    const out = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Uint8Array(out.buffer);
  }

  static int16BytesToFloat(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const out = new Float32Array(Math.floor(bytes.byteLength / 2));
    for (let i = 0; i < out.length; i++) out[i] = view.getInt16(i * 2, true) / 32768;
    return out;
  }

  static resampleLinear(samples, fromRate, toRate) {
    if (fromRate === toRate) return samples;
    const ratio = fromRate / toRate;
    const out = new Float32Array(Math.max(1, Math.floor(samples.length / ratio)));
    for (let i = 0; i < out.length; i++) out[i] = PcmSamples._interpolate(samples, i * ratio);
    return out;
  }

  static _interpolate(samples, position) {
    const i0 = Math.floor(position);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const t = position - i0;
    return samples[i0] * (1 - t) + samples[i1] * t;
  }
}

module.exports = PcmSamples;
