const fs = require('fs');
const WavCodec = require('../../shared/audio/WavCodec');

class PocketVoices {
  static DEFAULT_NUM_STEPS = 2;

  static load(pocketConfig, { readFile = fs.readFileSync, warn = console.warn } = {}) {
    const voices = PocketVoices._decodeVoices(pocketConfig.voices || [], readFile, warn);
    if (!voices.length) throw new Error('Pocket TTS needs at least one reference voice clip (voices/*.wav).');
    return new PocketVoices(voices, PocketVoices._numSteps(pocketConfig.numSteps));
  }

  constructor(voices, numSteps) {
    this.voices = voices;
    this.numSteps = numSteps;
  }

  get count() {
    return this.voices.length;
  }

  voiceFor(sid) {
    const index = Math.min(Math.max(0, sid), this.voices.length - 1);
    return this.voices[index];
  }

  static _decodeVoices(entries, readFile, warn) {
    const voices = [];
    for (const entry of entries) {
      const voice = PocketVoices._decodeVoice(entry, readFile, warn);
      if (voice) voices.push(voice);
    }
    return voices;
  }

  static _decodeVoice(entry, readFile, warn) {
    try {
      const { samples, sampleRate } = WavCodec.parse(readFile(entry.path));
      return { ...entry, samples, sampleRate };
    } catch (err) {
      warn(`[tts-worker] skipping unreadable voice clip ${entry.path}: ${err.message}`);
      return null;
    }
  }

  static _numSteps(value) {
    return Number(value) > 0 ? Number(value) : PocketVoices.DEFAULT_NUM_STEPS;
  }
}

module.exports = PocketVoices;
