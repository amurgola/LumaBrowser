class TensorFloats {
  static BYTES = Object.freeze({ BF16: 2, F16: 2, F32: 4 });

  static supports(dtype) {
    return Object.prototype.hasOwnProperty.call(TensorFloats.BYTES, dtype);
  }

  static decode(bytes, dtype) {
    if (!TensorFloats.supports(dtype)) throw new Error(`Unsupported weight type ${dtype}.`);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = bytes.byteLength / TensorFloats.BYTES[dtype];
    const floats = new Float32Array(count);
    if (dtype === 'F32') {
      for (let i = 0; i < count; i++) floats[i] = view.getFloat32(i * 4, true);
    } else if (dtype === 'BF16') {
      TensorFloats._decodeBf16(view, floats);
    } else {
      for (let i = 0; i < count; i++) floats[i] = TensorFloats._halfToFloat(view.getUint16(i * 2, true));
    }
    return floats;
  }

  static _decodeBf16(view, floats) {
    const bits = new Uint32Array(floats.buffer);
    for (let i = 0; i < floats.length; i++) bits[i] = view.getUint16(i * 2, true) << 16;
  }

  static _halfToFloat(half) {
    const sign = half & 0x8000 ? -1 : 1;
    const exponent = (half >> 10) & 0x1f;
    const fraction = half & 0x3ff;
    if (exponent === 0) return sign * fraction * 2 ** -24;
    if (exponent === 31) return fraction ? NaN : sign * Infinity;
    return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
  }
}

module.exports = TensorFloats;
