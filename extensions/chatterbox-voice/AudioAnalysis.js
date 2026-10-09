const CoreRequire = require('./CoreRequire');
const PitchEstimator = require('./PitchEstimator');

const WavCodec = CoreRequire.load('shared/audio/WavCodec');

class AudioAnalysis {
  static TARGET_RMS_DB = -20;
  static PEAK_CEIL_DB = -1;
  static MIN_GAIN_DB = 0.5;

  static rmsDb(samples) {
    if (!samples.length) return -Infinity;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    return 20 * Math.log10(Math.sqrt(sum / samples.length) || 1e-9);
  }

  static peakDb(samples) {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
    return 20 * Math.log10(peak || 1e-9);
  }

  static normalizeLoudness(samples) {
    const gainDb = AudioAnalysis._gainDb(samples);
    if (gainDb == null || Math.abs(gainDb) < AudioAnalysis.MIN_GAIN_DB) return samples;
    const g = Math.pow(10, gainDb / 20);
    const out = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) out[i] = Math.max(-1, Math.min(1, samples[i] * g));
    return out;
  }

  static analyzeWav(wav) {
    const { samples, sampleRate } = WavCodec.parse(wav);
    return {
      seconds: Math.round((samples.length / sampleRate) * 10) / 10,
      sampleRate,
      rmsDb: Math.round(AudioAnalysis.rmsDb(samples) * 10) / 10,
      peakDb: Math.round(AudioAnalysis.peakDb(samples) * 10) / 10,
      medianHz: PitchEstimator.medianF0(samples, sampleRate).medianHz,
    };
  }

  static prepareReferenceClip(wav, opts = {}) {
    const { samples, sampleRate } = WavCodec.parse(wav);
    const skip = Math.max(0, Math.floor((Number(opts.trimStartSec) || 0) * sampleRate));
    const cut = skip > 0 && skip < samples.length - sampleRate ? samples.subarray(skip) : samples;
    const out = WavCodec.encode(AudioAnalysis.normalizeLoudness(cut), sampleRate);
    return { wav: out, analysis: AudioAnalysis.analyzeWav(out) };
  }

  static _gainDb(samples) {
    const cur = AudioAnalysis.rmsDb(samples);
    if (!Number.isFinite(cur)) return null;
    const headroom = AudioAnalysis.PEAK_CEIL_DB - AudioAnalysis.peakDb(samples);
    return Math.min(AudioAnalysis.TARGET_RMS_DB - cur, headroom);
  }
}

module.exports = AudioAnalysis;
