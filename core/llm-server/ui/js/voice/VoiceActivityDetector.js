import WavEncoder from './WavEncoder.js';

export default class VoiceActivityDetector {
  static FRAME_SAMPLES = 2048;
  static SAMPLE_RATE = 16000;
  static PRE_ROLL_MS = 1000;
  static MAX_UTTERANCE_MS = 30 * 1000;
  static INITIAL_NOISE_FLOOR = 0.006;
  static MIN_THRESHOLD = 0.012;
  static NOISE_MULTIPLIER = 3;
  static SILENCE_FACTOR = 0.7;
  static START_FRAMES = 2;
  static BARGE_IN_FRAMES = 4;
  static BARGE_IN_FACTOR = 2.4;
  static SPEAK_DUCK_MS = 350;

  static durationMs(frames) {
    return (frames.length * VoiceActivityDetector.FRAME_SAMPLES / VoiceActivityDetector.SAMPLE_RATE) * 1000;
  }

  constructor({ silenceMs = 800 } = {}) {
    this.silenceMs = silenceMs;
    this.reset();
  }

  reset() {
    this._noiseFloor = VoiceActivityDetector.INITIAL_NOISE_FLOOR;
    this._speechRun = 0;
    this._silenceStart = 0;
    this._preRoll = [];
    this.capture = null;
  }

  process(samples, now, { speaking = false, lastAudioStart = 0 } = {}) {
    const frame = new Float32Array(samples);
    const rms = WavEncoder.rms(frame);
    if (!this.capture) this._noiseFloor = this._noiseFloor * 0.995 + rms * 0.005;
    let threshold = Math.max(VoiceActivityDetector.MIN_THRESHOLD, this._noiseFloor * VoiceActivityDetector.NOISE_MULTIPLIER);
    if (speaking) {
      threshold *= VoiceActivityDetector.BARGE_IN_FACTOR;
      if (now - lastAudioStart < VoiceActivityDetector.SPEAK_DUCK_MS) return null;
    }
    return this.capture ? this._continue(frame, rms, threshold, now) : this._listen(frame, rms, threshold, now, speaking);
  }

  takeUtterance() {
    const utterance = this.capture;
    this.capture = null;
    this._speechRun = 0;
    return utterance;
  }

  _listen(frame, rms, threshold, now, speaking) {
    this._preRoll.push(frame);
    const maxFrames = Math.ceil((VoiceActivityDetector.PRE_ROLL_MS / 1000) * VoiceActivityDetector.SAMPLE_RATE / VoiceActivityDetector.FRAME_SAMPLES);
    while (this._preRoll.length > maxFrames) this._preRoll.shift();
    this._speechRun = rms > threshold ? this._speechRun + 1 : 0;
    if (this._speechRun < (speaking ? VoiceActivityDetector.BARGE_IN_FRAMES : VoiceActivityDetector.START_FRAMES)) return null;
    this.capture = { frames: this._preRoll.slice(), startedAt: now };
    this._silenceStart = 0;
    return 'start';
  }

  _continue(frame, rms, threshold, now) {
    this.capture.frames.push(frame);
    if (rms < threshold * VoiceActivityDetector.SILENCE_FACTOR) {
      if (!this._silenceStart) this._silenceStart = now;
      else if (now - this._silenceStart >= this.silenceMs) return 'end';
    } else {
      this._silenceStart = 0;
    }
    return now - this.capture.startedAt > VoiceActivityDetector.MAX_UTTERANCE_MS ? 'end' : null;
  }
}
