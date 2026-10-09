export default class WavEncoder {
  static HEADER_BYTES = 44;

  static rms(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / samples.length);
  }

  static encode(frames, sampleRate) {
    const pcm = WavEncoder._toPcm16(frames);
    const bytes = new Uint8Array(WavEncoder.HEADER_BYTES + pcm.length * 2);
    WavEncoder._writeHeader(new DataView(bytes.buffer), bytes, pcm.length * 2, sampleRate);
    bytes.set(new Uint8Array(pcm.buffer), WavEncoder.HEADER_BYTES);
    return bytes;
  }

  static _toPcm16(frames) {
    let total = 0;
    for (const frame of frames) total += frame.length;
    const pcm = new Int16Array(total);
    let offset = 0;
    for (const frame of frames) {
      for (let i = 0; i < frame.length; i++) {
        const s = Math.max(-1, Math.min(1, frame[i]));
        pcm[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }
    return pcm;
  }

  static _writeHeader(view, bytes, dataBytes, sampleRate) {
    const text = (at, s) => { for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i); };
    text(0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, dataBytes, true);
  }
}
