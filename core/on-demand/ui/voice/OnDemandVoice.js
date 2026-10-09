import AudioFrames from './AudioFrames.js';
import MicCapture from './MicCapture.js';
import PcmPlayer from './PcmPlayer.js';
import SpeakableChunker from './SpeakableChunker.js';
import UtteranceDetector from './UtteranceDetector.js';

export default class OnDemandVoice {
  static MIN_UTTERANCE_MS = 350;
  static SPEAK_DUCK_MS = 350;
  static TTS_STALE_MS = 60 * 1000;
  static PARTIAL_EVERY_MS = 1200;
  static PARTIAL_MIN_MS = 600;
  static SETUP_CODES = ['NO_STT_MODEL', 'STT_RUNTIME_MISSING'];
  static NOISE_MARKS = /\[[^\]]*\]|\([^)]*\)/g;

  static create({ api, win, hooks = {}, parts = {} }) {
    if (!api || !api.voice) return null;
    return new OnDemandVoice({ api, win, hooks, parts });
  }

  constructor({ api, win, hooks, parts }) {
    this._api = api;
    this._hooks = hooks;
    this._mic = parts.mic || new MicCapture(win);
    this._detector = parts.detector || new UtteranceDetector();
    this._player = parts.player || new PcmPlayer(win.AudioContext, () => this._maybeFinishSpeaking());
    this._now = parts.now || (() => win.performance.now());
    this._chunker = new SpeakableChunker();
    this._state = 'off';
    this._speakOn = false;
    this._unsubTts = null;
    this._lastAudioStart = 0;
    this._partialTimer = null;
    this._partialBusy = false;
    this._partialGen = 0;
    this._ttsSeq = 0;
    this._pendingTts = new Map();
    this._turnOver = false;
  }

  get state() {
    return this._state;
  }

  isOn() {
    return this._state !== 'off';
  }

  speaks() {
    return this._speakOn;
  }

  async start() {
    if (this._state !== 'off') return;
    this._setState('starting');
    try {
      await this._mic.open((f32) => this._handleFrame(f32));
    } catch (err) {
      this._setState('off');
      this._call('onMicError', err);
      return;
    }
    this._detector.reset();
    if (!this._unsubTts) this._unsubTts = this._api.voice.onTtsEvent((evt) => this._onTtsEvent(evt));
    this._setState('listening');
  }

  stop() {
    this._stopPartials();
    this._silence();
    this._mic.close();
    this._detector.reset();
    if (this._unsubTts) {
      try { this._unsubTts(); } catch (_) {}
      this._unsubTts = null;
    }
    this._call('onPartial', null);
    this._setState('off');
  }

  setSpeak(on) {
    this._speakOn = !!on;
    if (!this._speakOn) this.stopSpeaking();
  }

  setWaiting() {
    if (this._state === 'off') return;
    this._chunker.reset();
    this._turnOver = false;
    this._setState('waiting');
  }

  onDelta(text) {
    if (this._state === 'off' || !text || !this._speakOn) return;
    this._speakAll(this._chunker.push(text));
  }

  onTurnDone() {
    if (this._state === 'off') return;
    this._turnOver = true;
    if (this._speakOn) this._speakAll(this._chunker.flush());
    this._maybeFinishSpeaking();
  }

  onTurnError() {
    if (this._state === 'off') return;
    this._resetTurn();
    if (this._state === 'waiting' || this._state === 'speaking') this._setState('listening');
  }

  stopSpeaking() {
    this._silence();
    if (this._state === 'speaking') this._setState('listening');
  }

  _call(name, ...args) {
    try { if (typeof this._hooks[name] === 'function') this._hooks[name](...args); } catch (_) {}
  }

  _setState(s) {
    if (this._state === s) return;
    this._state = s;
    this._call('onState', s);
  }

  _resetTurn() {
    this._chunker.reset();
    this._turnOver = false;
  }

  _silence() {
    this._player.stop();
    for (const id of this._pendingTts.keys()) this._api.voice.synthesizeAbort(id).catch(() => {});
    this._pendingTts.clear();
    this._resetTurn();
  }

  _handleFrame(f32) {
    if (this._state === 'off' || this._state === 'starting' || this._state === 'transcribing') return;
    const now = this._now();
    const speaking = this._state === 'speaking';
    const ducked = now - this._lastAudioStart < OnDemandVoice.SPEAK_DUCK_MS;
    const event = this._detector.feed(f32, { now, speaking, ducked });
    if (event === 'start') this._onSpeechStart(speaking);
    else if (event === 'end') this._endUtterance();
  }

  _onSpeechStart(bargeIn) {
    if (bargeIn) this._bargeIn();
    this._setState('capturing');
    this._startPartials();
  }

  _bargeIn() {
    this._player.stop();
    for (const id of this._pendingTts.keys()) this._api.voice.synthesizeAbort(id).catch(() => {});
    this._pendingTts.clear();
    this._call('onBargeIn');
    this._resetTurn();
  }

  async _endUtterance() {
    const utt = this._detector.take();
    this._partialGen++;
    this._stopPartials();
    if (!utt) return;
    if (UtteranceDetector.durationMs(utt.frames) < OnDemandVoice.MIN_UTTERANCE_MS) return this._backToListening();
    this._setState('transcribing');
    const text = await this._transcribe(utt.frames);
    if (text === null || this._state === 'off') return undefined;
    if (OnDemandVoice._wordCount(text) < 2) return this._backToListening();
    this._call('onPartial', null);
    this._silence();
    this._setState('waiting');
    this._call('onUtterance', text);
    return undefined;
  }

  _backToListening() {
    this._call('onPartial', null);
    this._setState('listening');
  }

  async _transcribe(frames) {
    try {
      const r = await this._api.voice.transcribe(AudioFrames.encodeWav(frames, this._mic.sampleRate));
      if (r && r.success) return (r.text || '').trim();
      if (r && r.code && OnDemandVoice.SETUP_CODES.includes(r.code)) {
        this.stop();
        this._call('onSetupNeeded', r.code);
        return null;
      }
    } catch (_) {}
    return '';
  }

  static _wordCount(text) {
    const cleaned = text.replace(OnDemandVoice.NOISE_MARKS, '').trim();
    return cleaned ? cleaned.split(/\s+/).length : 0;
  }

  _startPartials() {
    this._stopPartials();
    this._call('onPartial', '');
    this._partialTimer = setInterval(() => this._runPartial(), OnDemandVoice.PARTIAL_EVERY_MS);
  }

  _stopPartials() {
    if (!this._partialTimer) return;
    clearInterval(this._partialTimer);
    this._partialTimer = null;
  }

  async _runPartial() {
    if (this._state !== 'capturing' || !this._detector.isCapturing() || this._partialBusy) return;
    const frames = this._detector.capturedFrames();
    if (UtteranceDetector.durationMs(frames) < OnDemandVoice.PARTIAL_MIN_MS) return;
    this._partialBusy = true;
    const gen = this._partialGen;
    try {
      const r = await this._api.voice.transcribe(AudioFrames.encodeWav(frames, this._mic.sampleRate));
      if (gen !== this._partialGen || this._state !== 'capturing') return;
      const t = r && r.success ? (r.text || '').replace(OnDemandVoice.NOISE_MARKS, '').trim() : '';
      if (t) this._call('onPartial', t);
    } catch (_) {
    } finally {
      this._partialBusy = false;
    }
  }

  _speakAll(chunks) {
    for (const text of chunks) this._speak(text);
  }

  _speak(text) {
    const requestId = 'od-' + Date.now() + '-' + (this._ttsSeq++);
    this._pendingTts.set(requestId, true);
    if (this._state === 'waiting') this._setState('speaking');
    setTimeout(() => this._dropPending(requestId), OnDemandVoice.TTS_STALE_MS);
    this._api.voice.synthesize({ requestId, text })
      .then((r) => { if (!r || r.success === false) this._dropPending(requestId); })
      .catch(() => this._dropPending(requestId));
  }

  _dropPending(requestId) {
    if (!this._pendingTts.has(requestId)) return;
    this._pendingTts.delete(requestId);
    this._maybeFinishSpeaking();
  }

  _onTtsEvent(evt) {
    if (!evt || !this._pendingTts.has(evt.requestId)) return;
    if (evt.type === 'chunk') this._playChunk(evt.requestId, evt.payload);
    else if (evt.type === 'done' || evt.type === 'error') this._dropPending(evt.requestId);
  }

  _playChunk(requestId, payload) {
    if (this._state === 'off') return;
    if (!this._player.schedule(requestId, payload)) return;
    if (this._state === 'waiting') this._setState('speaking');
    this._lastAudioStart = this._now();
  }

  _maybeFinishSpeaking() {
    if (this._state !== 'speaking' && this._state !== 'waiting') return;
    if (!this._turnOver) return;
    if (this._pendingTts.size > 0 || this._player.activeCount > 0) return;
    this._resetTurn();
    this._setState('listening');
  }
}
