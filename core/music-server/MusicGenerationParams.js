class MusicGenerationParams {
  static DEFAULT_MAX_FRAMES = 9000;
  static DEFAULT_MAX_DURATION_SEC = 300;
  static MIN_DURATION_SEC = 30;
  static WAV_HEADER_BYTES = 44;
  static BYTES_PER_FRAME = 4;

  static maxNewTokens(model, durationSec) {
    const constraints = (model && model.constraints) || {};
    const maxFrames = Number(constraints.maxAcousticFrames) || MusicGenerationParams.DEFAULT_MAX_FRAMES;
    const maxDur = Number(constraints.maxDurationSec) || MusicGenerationParams.DEFAULT_MAX_DURATION_SEC;
    if (!(Number(durationSec) > 0)) return (model && model.defaults && model.defaults.maxNewTokens) || maxFrames;
    const clamped = Math.min(maxDur, Math.max(MusicGenerationParams.MIN_DURATION_SEC, Number(durationSec)));
    return Math.min(maxFrames, Math.round(clamped * (maxFrames / maxDur)));
  }

  static effectiveSeed(seed, defaults) {
    if (Number.isFinite(seed)) return Math.trunc(seed);
    return defaults && Number.isFinite(defaults.seed) ? defaults.seed : undefined;
  }

  static wavDurationSec(bytes, sampleRate) {
    if (!bytes || bytes.length <= MusicGenerationParams.WAV_HEADER_BYTES || !sampleRate) return null;
    return (bytes.length - MusicGenerationParams.WAV_HEADER_BYTES) / (sampleRate * MusicGenerationParams.BYTES_PER_FRAME);
  }
}

module.exports = MusicGenerationParams;
