export default class AudioFrames {
  static WAV_HEADER_BYTES = 44;

  static rms(f32) {
    let sum = 0;
    for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
    return Math.sqrt(sum / f32.length);
  }

  static encodeWav(frames, sampleRate) {
    const data = AudioFrames._pcm16(frames);
    const bytes = new Uint8Array(AudioFrames.WAV_HEADER_BYTES + data.length * 2);
    AudioFrames._writeHeader(new DataView(bytes.buffer), bytes, data.length * 2, sampleRate);
    bytes.set(new Uint8Array(data.buffer), AudioFrames.WAV_HEADER_BYTES);
    return bytes;
  }

  static _pcm16(frames) {
    let n = 0;
    for (const f of frames) n += f.length;
    const data = new Int16Array(n);
    let off = 0;
    for (const f of frames) {
      for (let i = 0; i < f.length; i++) {
        const s = Math.max(-1, Math.min(1, f[i]));
        data[off++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }
    return data;
  }

  static _writeHeader(dv, bytes, dataBytes, sampleRate) {
    const ascii = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
    ascii(0, 'RIFF');
    dv.setUint32(4, 36 + dataBytes, true);
    ascii(8, 'WAVE');
    ascii(12, 'fmt ');
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true);
    dv.setUint32(24, sampleRate, true);
    dv.setUint32(28, sampleRate * 2, true);
    dv.setUint16(32, 2, true);
    dv.setUint16(34, 16, true);
    ascii(36, 'data');
    dv.setUint32(40, dataBytes, true);
  }
}
