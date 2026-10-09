const CoreRequire = require('./CoreRequire');

const PcmSamples = CoreRequire.load('shared/audio/PcmSamples');

class PcmChunker {
  static CHUNK_SEC = 1.0;

  static deliver(wav, onChunk) {
    const per = Math.max(1, Math.round(wav.sampleRate * PcmChunker.CHUNK_SEC));
    let seq = 0;
    for (let off = 0; off < wav.samples.length; off += per) {
      const slice = wav.samples.subarray(off, Math.min(wav.samples.length, off + per));
      try { onChunk({ seq: seq++, sampleRate: wav.sampleRate, pcm: PcmSamples.floatToInt16Bytes(slice) }); } catch (_) {}
    }
  }
}

module.exports = PcmChunker;
