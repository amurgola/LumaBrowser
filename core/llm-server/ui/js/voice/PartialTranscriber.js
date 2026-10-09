import WavEncoder from './WavEncoder.js';
import VoiceActivityDetector from './VoiceActivityDetector.js';

export default class PartialTranscriber {
  static EVERY_MS = 1200;
  static MIN_MS = 600;
  static ANNOTATIONS = /\[[^\]]*\]|\([^)]*\)/g;

  constructor({ api, transcript, frames, sampleRate }) {
    this._api = api;
    this._transcript = transcript;
    this._frames = frames;
    this._sampleRate = sampleRate;
    this._timer = null;
    this._busy = false;
    this._generation = 0;
  }

  start() {
    this.stop();
    this._transcript.show('', false);
    this._timer = setInterval(() => this._run(), PartialTranscriber.EVERY_MS);
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  invalidate() {
    this._generation++;
  }

  async _run() {
    const live = this._frames();
    if (!live || this._busy) return;
    const frames = live.slice();
    if (VoiceActivityDetector.durationMs(frames) < PartialTranscriber.MIN_MS) return;
    this._busy = true;
    const generation = this._generation;
    try {
      const r = await this._api.voice.transcribe(WavEncoder.encode(frames, this._sampleRate()));
      if (generation !== this._generation || !this._frames()) return;
      const text = r && r.success ? (r.text || '').replace(PartialTranscriber.ANNOTATIONS, '').trim() : '';
      if (text) this._transcript.show(text, false);
    } catch (_) {} finally {
      this._busy = false;
    }
  }
}
