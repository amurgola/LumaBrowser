import AudioFrames from './AudioFrames.js';

export default class UtteranceDetector {
  static SAMPLE_RATE = 16000;
  static FRAME = 2048;
  static SILENCE_MS = 800;
  static MAX_UTTERANCE_MS = 30 * 1000;
  static PRE_ROLL_MS = 1000;
  static BARGE_IN_FACTOR = 2.4;
  static BARGE_IN_FRAMES = 4;
  static START_FRAMES = 2;
  static INITIAL_NOISE_FLOOR = 0.006;
  static MIN_THRESHOLD = 0.012;

  constructor() {
    this.reset();
  }

  reset() {
    this._noiseFloor = UtteranceDetector.INITIAL_NOISE_FLOOR;
    this._speechRun = 0;
    this._silenceStart = 0;
    this._preRoll = [];
    this._capture = null;
  }

  isCapturing() {
    return !!this._capture;
  }

  feed(f32, { now, speaking = false, ducked = false }) {
    const frame = new Float32Array(f32);
    const level = AudioFrames.rms(frame);
    if (!this._capture) this._noiseFloor = this._noiseFloor * 0.995 + level * 0.005;
    const threshold = this._threshold(speaking);
    if (speaking && ducked) return null;
    if (!this._capture) return this._listen(frame, level, threshold, now, speaking);
    return this._record(frame, level, threshold, now);
  }

  take() {
    const utt = this._capture;
    this._capture = null;
    this._speechRun = 0;
    return utt;
  }

  capturedFrames() {
    return this._capture ? this._capture.frames.slice() : [];
  }

  static durationMs(frames) {
    return (frames.length * UtteranceDetector.FRAME / UtteranceDetector.SAMPLE_RATE) * 1000;
  }

  _threshold(speaking) {
    const base = Math.max(UtteranceDetector.MIN_THRESHOLD, this._noiseFloor * 3);
    return speaking ? base * UtteranceDetector.BARGE_IN_FACTOR : base;
  }

  _listen(frame, level, threshold, now, speaking) {
    this._preRoll.push(frame);
    const maxFrames = Math.ceil((UtteranceDetector.PRE_ROLL_MS / 1000) * UtteranceDetector.SAMPLE_RATE / UtteranceDetector.FRAME);
    while (this._preRoll.length > maxFrames) this._preRoll.shift();
    this._speechRun = level > threshold ? this._speechRun + 1 : 0;
    if (this._speechRun < (speaking ? UtteranceDetector.BARGE_IN_FRAMES : UtteranceDetector.START_FRAMES)) return null;
    this._capture = { frames: this._preRoll.slice(), startedAt: now };
    this._silenceStart = 0;
    return 'start';
  }

  _record(frame, level, threshold, now) {
    this._capture.frames.push(frame);
    if (level < threshold * 0.7) {
      if (!this._silenceStart) this._silenceStart = now;
      else if (now - this._silenceStart >= UtteranceDetector.SILENCE_MS) return 'end';
    } else {
      this._silenceStart = 0;
    }
    return now - this._capture.startedAt > UtteranceDetector.MAX_UTTERANCE_MS ? 'end' : null;
  }
}
