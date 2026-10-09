import VoiceActivityDetector from './VoiceActivityDetector.js';
import MicCapture from './MicCapture.js';
import PcmScheduler from './PcmScheduler.js';
import SpeechStreamChunker from './SpeechStreamChunker.js';
import SpeechText from './SpeechText.js';
import LoopSpeech from './LoopSpeech.js';
import LiveTranscript from './LiveTranscript.js';
import PartialTranscriber from './PartialTranscriber.js';
import IdleCue from './IdleCue.js';
import MicProbe from './MicProbe.js';
import VoicePanels from './VoicePanels.js';
import ReadAloudReader from './ReadAloudReader.js';
import VoiceStyles from './VoiceStyles.js';
import WavEncoder from './WavEncoder.js';

export default class VoiceController {
  static STATE_LABEL = {
    off: 'Voice conversation',
    starting: 'Starting voice mode…',
    listening: 'Listening: speak, or click to exit',
    capturing: 'Hearing you…',
    transcribing: 'Transcribing…',
    waiting: 'Thinking: talk to interrupt',
    speaking: 'Speaking: talk to interrupt',
  };

  static PUBLIC_METHODS = ['wireButton', 'toggle', 'onChatDelta', 'onTurnDone', 'onTurnError', 'readAloud', 'stopReading'];
  static MIN_UTTERANCE_MS = 350;
  static ABORT_WAIT_TICKS = 80;
  static ABORT_WAIT_MS = 100;
  static MISSING_STT_CODES = ['NO_STT_MODEL', 'STT_RUNTIME_MISSING'];

  static create(options) {
    return options && options.api && options.api.voice ? new VoiceController(options) : null;
  }

  constructor({ api, chat, onReadingChange, audioContext = null }) {
    this._api = api;
    this._chat = chat;
    this._state = 'off';
    this._buttons = new Set();
    this._turnOver = false;
    this._lastAudioStart = 0;
    this._build(api, onReadingChange, audioContext);
    for (const name of VoiceController.PUBLIC_METHODS) this[name] = this[name].bind(this);
    VoiceStyles.ensure();
  }

  get active() {
    return this._state !== 'off';
  }

  get state() {
    return this._state;
  }

  get readingKey() {
    return this._reader.key;
  }

  get readingState() {
    return this._reader.state;
  }

  wireButton(button) {
    this._buttons.add(button);
    button.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(button); });
    this._paint();
  }

  async toggle(anchor) {
    if (this._state !== 'off') { this._stopAll('off'); return; }
    if (this._panels.isOpen) { this._panels.close(); return; }
    const target = anchor || this._firstLiveButton();
    if (!this._micSupported(target)) return;
    this._setState('starting');
    const views = await this._engineViews();
    this._setState('off');
    if (!views) return;
    if (!VoiceController._ready(views.stt) || !VoiceController._ready(views.tts)) { this._panels.openSetup(target, views); return; }
    this._api.voice.stt.prewarm().catch(() => {});
    this._api.voice.tts.prewarm().catch(() => {});
    this._panels.openMic(target, undefined, () => this._begin());
  }

  onChatDelta(text) {
    if (this._state === 'off' || !text) return;
    for (const chunk of this._chunker.push(text)) this._speak(chunk);
  }

  onTurnDone() {
    if (this._state === 'off') return;
    this._turnOver = true;
    for (const chunk of this._chunker.flush()) this._speak(chunk);
    this._maybeFinishSpeaking();
  }

  onTurnError() {
    if (this._state === 'off') return;
    this._resetTurn();
    if (this._state === 'waiting' || this._state === 'speaking') this._setState('listening');
  }

  async readAloud(text, key, anchor) {
    if (this._reader.active) {
      const same = this._reader.key === key;
      this.stopReading();
      if (same) return false;
    }
    this._panels.close();
    if (this._state !== 'off') return false;
    const chunks = SpeechText.speakableChunks(text);
    if (!chunks.length) return false;
    let view = null;
    try { view = await this._api.voice.tts.getView(); } catch (_) { return false; }
    if (!VoiceController._ready(view)) { this._panels.openSetup(anchor, { tts: view }, 'read'); return false; }
    if (this._reader.active || this._state !== 'off') return false;
    this._reader.start(key, chunks);
    return true;
  }

  stopReading() {
    this._reader.stop();
  }

  _build(api, onReadingChange, audioContext) {
    this._vad = new VoiceActivityDetector();
    this._mic = new MicCapture(audioContext);
    this._playback = new PcmScheduler(audioContext);
    this._chunker = new SpeechStreamChunker();
    this._speech = new LoopSpeech({ api, onChunk: (id, payload) => this._playChunk(id, payload), onSettled: () => this._maybeFinishSpeaking() });
    this._transcript = new LiveTranscript(() => this._firstLiveButton());
    this._partials = new PartialTranscriber({
      api, transcript: this._transcript, sampleRate: () => this._mic.sampleRate,
      frames: () => (this._state === 'capturing' && this._vad.capture ? this._vad.capture.frames : null),
    });
    this._idle = new IdleCue(this._playback, () => this._state === 'waiting');
    this._panels = new VoicePanels(api, { probe: new MicProbe(audioContext) });
    this._reader = new ReadAloudReader({ api, onChange: onReadingChange, scheduler: new PcmScheduler(audioContext) });
  }

  _micSupported(anchor) {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') return true;
    this._panels.openNote(anchor, 'Voice conversation', window.isSecureContext === false
      ? 'The browser blocks microphone access on an http:// address. Open this page over https:// (a tunnel or reverse proxy in front of the host) to talk to the model. Read aloud still works here.'
      : 'This browser has no microphone support. Read aloud still works here.');
    return false;
  }

  async _engineViews() {
    try {
      const [stt, tts] = await Promise.all([this._api.voice.stt.getView(), this._api.voice.tts.getView()]);
      return { stt, tts };
    } catch (_) {
      return null;
    }
  }

  static _ready(view) {
    return !!(view && view.success && view.runtimeReady && (view.models || []).length > 0);
  }

  async _begin() {
    this._panels.close();
    this.stopReading();
    this._setState('starting');
    try {
      await this._startListening();
    } catch (err) {
      this._stopAll('off');
      this._panels.openMic(this._firstLiveButton(), err, () => this._begin());
    }
  }

  async _startListening() {
    this._vad.reset();
    await this._mic.start((samples) => this._onFrame(samples));
    this._speech.listen();
    this._setState('listening');
  }

  _onFrame(samples) {
    const state = this._state;
    if (state === 'off' || state === 'starting' || state === 'transcribing') return;
    const event = this._vad.process(samples, performance.now(), { speaking: state === 'speaking', lastAudioStart: this._lastAudioStart });
    if (event === 'start') {
      if (state === 'speaking') this._bargeIn();
      this._setState('capturing');
    } else if (event === 'end') {
      this._endUtterance();
    }
  }

  async _endUtterance() {
    const utterance = this._vad.takeUtterance();
    this._partials.invalidate();
    if (!utterance) return;
    if (VoiceActivityDetector.durationMs(utterance.frames) < VoiceController.MIN_UTTERANCE_MS) { this._backToListening(); return; }
    this._setState('transcribing');
    const text = await this._transcribe(utterance.frames);
    if (text == null || this._state !== 'transcribing') return;
    if (!VoiceController._isSpeech(text)) { this._backToListening(); return; }
    this._transcript.show(text, true);
    await this._interruptTurn();
    this._resetTurn();
    this._setState('waiting');
    this._transcript.hide();
    try { this._chat.submit(text); } catch (_) { this._setState('listening'); }
  }

  async _transcribe(frames) {
    try {
      const r = await this._api.voice.transcribe(WavEncoder.encode(frames, this._mic.sampleRate));
      if (r && r.success) return (r.text || '').trim();
      if (r && VoiceController.MISSING_STT_CODES.includes(r.code)) {
        this._stopAll('off');
        this._panels.openSetup(this._firstLiveButton(), null);
        return null;
      }
    } catch (_) {}
    return '';
  }

  static _isSpeech(text) {
    const cleaned = text.replace(PartialTranscriber.ANNOTATIONS, '').trim();
    return !!cleaned && cleaned.split(/\s+/).length >= 2;
  }

  _backToListening() {
    this._transcript.hide();
    this._setState('listening');
  }

  async _interruptTurn() {
    const streaming = () => !!(this._chat.isStreaming && this._chat.isStreaming());
    if (streaming()) {
      this._playback.stop();
      this._speech.abortAll();
      try { this._chat.abort(); } catch (_) {}
    }
    for (let i = 0; i < VoiceController.ABORT_WAIT_TICKS && streaming(); i++) {
      await new Promise((r) => setTimeout(r, VoiceController.ABORT_WAIT_MS));
    }
  }

  _speak(text) {
    this._speech.speak(text);
    if (this._state === 'waiting') this._setState('speaking');
  }

  _playChunk(requestId, payload) {
    if (this._state === 'off') return;
    if (!this._playback.schedule(requestId, payload, () => this._maybeFinishSpeaking())) return;
    if (this._state === 'waiting') this._setState('speaking');
    this._lastAudioStart = performance.now();
  }

  _maybeFinishSpeaking() {
    if (this._state !== 'speaking' && this._state !== 'waiting') return;
    if (!this._turnOver || this._speech.pendingCount > 0 || this._playback.liveCount > 0) return;
    this._resetTurn();
    this._setState('listening');
  }

  _bargeIn() {
    this._playback.stop();
    this._speech.abortAll();
    try { if (this._chat.isStreaming && this._chat.isStreaming()) this._chat.abort(); } catch (_) {}
    this._resetTurn();
  }

  _resetTurn() {
    this._chunker.reset();
    this._turnOver = false;
  }

  _stopAll(next) {
    this._partials.invalidate();
    this._transcript.hide();
    this._playback.stop();
    this._speech.abortAll();
    this._resetTurn();
    this._mic.stop();
    this._playback.close();
    this._vad.reset();
    this._setState(next || 'off');
  }

  _setState(next) {
    this._state = next;
    if (next === 'waiting') this._idle.start();
    else this._idle.stop();
    if (next === 'capturing') this._partials.start();
    else this._partials.stop();
    this._paint();
  }

  _firstLiveButton() {
    for (const button of this._buttons) if (button.isConnected) return button;
    return null;
  }

  _paint() {
    for (const button of [...this._buttons]) {
      if (!button.isConnected) { this._buttons.delete(button); continue; }
      button.classList.toggle('cm-mic-on', this._state !== 'off');
      button.dataset.voiceState = this._state;
      button.title = VoiceController.STATE_LABEL[this._state] || 'Voice conversation';
    }
  }
}
