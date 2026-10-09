export default class PanelStatus {
  static ELLIPSIS = String.fromCharCode(0x2026);

  constructor(el) {
    this._el = el;
  }

  paintVoice(view) {
    const st = view.voiceState;
    const usable = !!(view.state && view.state.stt) && view.hasVoice;
    this._el.mic.dataset.state = usable ? st : 'unavailable';
    this._el.mic.title = PanelStatus._micTitle(usable, st);
    this._el.live.classList.toggle('on', st === 'listening' || st === 'capturing');
    this._el.live.classList.toggle('busy', view.streaming || st === 'transcribing' || st === 'waiting' || st === 'speaking');
    this._el.speak.setAttribute('aria-pressed', view.speak ? 'true' : 'false');
    this._el.speak.hidden = !(view.state && view.state.tts);
  }

  paintHint(view) {
    if (!view.state) return;
    const hint = PanelStatus.hintFor(view);
    this.setHint(hint.text, hint.warn);
  }

  setHint(text, warn) {
    this._el.hint.textContent = text || '';
    this._el.hint.classList.toggle('warn', !!warn);
  }

  static hintFor(view) {
    const s = view.state;
    if (!s.hasModel) return { text: 'No language model is set up yet. Open the LLM tab to configure one.', warn: true };
    if (view.streaming) return { text: 'Working on it. Speak or type to interrupt.' };
    if (!s.stt) return { text: 'Voice needs the speech model: LLM tab, Setup, Voice. Typing works now.' };
    return { text: PanelStatus._voiceHint(view.voiceState) };
  }

  static _voiceHint(st) {
    const e = PanelStatus.ELLIPSIS;
    switch (st) {
      case 'listening': return 'Listening. Try "click the news button" or "what is this page about?"';
      case 'capturing': return 'Hearing you' + e;
      case 'transcribing': return 'Transcribing' + e;
      case 'speaking': return 'Speaking. Talk over me to interrupt.';
      case 'starting': return 'Opening the microphone' + e;
      default: return 'Press the mic to talk, or type below.';
    }
  }

  static _micTitle(usable, st) {
    if (!usable) return 'Voice needs the speech model (set it up in the LLM tab)';
    return st === 'off' ? 'Start listening' : 'Stop listening';
  }
}
