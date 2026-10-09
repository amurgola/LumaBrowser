const PcmSamples = require('./PcmSamples');

class WavCodec {
  static FORMAT_PCM = 1;
  static FORMAT_FLOAT = 3;
  static FORMAT_EXTENSIBLE = 0xfffe;
  static HEADER_BYTES = 44;

  static parse(bytes) {
    const buf = WavCodec._toBuffer(bytes);
    WavCodec._assertRiffWave(buf);
    const { fmt, data } = WavCodec._readChunks(buf);
    WavCodec._assertFormat(fmt, data);
    const samples = WavCodec._decodeMono(fmt, data);
    return { samples, sampleRate: fmt.sampleRate, channels: fmt.channels };
  }

  static encode(samples, sampleRate) {
    const pcm = PcmSamples.floatToInt16Bytes(samples);
    const header = WavCodec._buildHeader(pcm.byteLength, sampleRate);
    return Buffer.concat([header, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength)]);
  }

  static durationSec(bytes) {
    const { samples, sampleRate } = WavCodec.parse(bytes);
    return samples.length / sampleRate;
  }

  static _toBuffer(bytes) {
    return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  static _assertRiffWave(buf) {
    const isWave = buf.length >= 12
      && buf.toString('ascii', 0, 4) === 'RIFF'
      && buf.toString('ascii', 8, 12) === 'WAVE';
    if (!isWave) throw new Error('parseWav: not a RIFF/WAVE file');
  }

  static _readChunks(buf) {
    let offset = 12;
    let fmt = null;
    while (offset + 8 <= buf.length) {
      const id = buf.toString('ascii', offset, offset + 4);
      const size = buf.readUInt32LE(offset + 4);
      const body = offset + 8;
      if (id === 'fmt ') fmt = WavCodec._readFmt(buf, body, size);
      if (id === 'data') return { fmt, data: buf.subarray(body, Math.min(buf.length, body + size)) };
      offset = body + size + (size & 1);
    }
    return { fmt, data: null };
  }

  static _readFmt(buf, body, size) {
    let format = buf.readUInt16LE(body);
    if (format === WavCodec.FORMAT_EXTENSIBLE && size >= 26) format = buf.readUInt16LE(body + 24);
    return {
      format,
      channels: buf.readUInt16LE(body + 2),
      sampleRate: buf.readUInt32LE(body + 4),
      bits: buf.readUInt16LE(body + 14),
    };
  }

  static _assertFormat(fmt, data) {
    if (!fmt || !data) throw new Error('parseWav: missing fmt or data chunk');
    if (!fmt.channels || !fmt.sampleRate) throw new Error('parseWav: invalid fmt chunk');
    if (![1, 2, 3, 4].includes(fmt.bits / 8)) throw new Error(`parseWav: unsupported bit depth ${fmt.bits}`);
  }

  static _decodeMono(fmt, data) {
    const bytesPerSample = fmt.bits / 8;
    const readSample = WavCodec._sampleReader(bytesPerSample, fmt.format === WavCodec.FORMAT_FLOAT);
    const frames = Math.floor(data.length / bytesPerSample / fmt.channels);
    const out = new Float32Array(frames);
    for (let i = 0; i < frames; i++) {
      let sum = 0;
      for (let c = 0; c < fmt.channels; c++) sum += readSample(data, (i * fmt.channels + c) * bytesPerSample);
      out[i] = sum / fmt.channels;
    }
    return out;
  }

  static _sampleReader(bytesPerSample, isFloat) {
    if (bytesPerSample === 2) return (d, p) => d.readInt16LE(p) / 32768;
    if (bytesPerSample === 4) return isFloat ? (d, p) => d.readFloatLE(p) : (d, p) => d.readInt32LE(p) / 2147483648;
    if (bytesPerSample === 3) return (d, p) => (((d[p] | (d[p + 1] << 8) | (d[p + 2] << 16)) << 8) >> 8) / 8388608;
    return (d, p) => (d[p] - 128) / 128;
  }

  static _buildHeader(pcmBytes, sampleRate) {
    const header = Buffer.alloc(WavCodec.HEADER_BYTES);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmBytes, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(WavCodec.FORMAT_PCM, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcmBytes, 40);
    return header;
  }
}

module.exports = WavCodec;
