import VoicePopover from './VoicePopover.js';
import MicProbe from './MicProbe.js';
import MicPicker from './MicPicker.js';
import SttChoice from './SttChoice.js';
import VoiceQualityChoice from './VoiceQualityChoice.js';
import VoiceSetupRows from './VoiceSetupRows.js';

export default class VoicePanels {
  constructor(api, { probe = new MicProbe() } = {}) {
    this._api = api;
    this._probe = probe;
    this._popover = new VoicePopover({ onClose: () => this._probe.stop() });
  }

  get isOpen() {
    return this._popover.isOpen;
  }

  close() {
    this._popover.close();
  }

  openNote(anchor, title, text) {
    return this._popover.openNote(anchor, title, text);
  }

  openSetup(anchor, views, purpose) {
    const where = this._api.voice.remote === true ? 'on the host computer' : 'on this computer';
    const pop = this._popover.open(anchor, VoicePanels._setupIntro(purpose === 'read', where)
      + '<div class="cm-voice-rows"></div><div class="cm-voice-pop-note"></div>');
    if (!pop) return null;
    new VoiceSetupRows(this._api).render(pop.querySelector('.cm-voice-rows'), pop.querySelector('.cm-voice-pop-note'), views, purpose);
    return pop;
  }

  openMic(anchor, initialErr, onStart) {
    const pop = this._popover.open(anchor,
      '<div class="cm-voice-pop-title">Voice conversation</div>'
      + '<div class="cm-voice-pop-body">Pick a microphone: the bar below shows what it hears.</div>'
      + '<div class="cm-voice-mics"></div>'
      + '<div class="cm-voice-meter"><div class="cm-voice-meter-fill"></div></div>'
      + '<div class="cm-voice-stt"></div>'
      + '<div class="cm-voice-quality"></div>'
      + '<button class="cm-voice-install" type="button">Start voice conversation</button>'
      + '<div class="cm-voice-pop-note"></div>');
    if (!pop) return null;
    const note = pop.querySelector('.cm-voice-pop-note');
    pop.querySelector('.cm-voice-install').addEventListener('click', () => onStart());
    new MicPicker(this._api, this._probe).render(pop, note, initialErr);
    new SttChoice(this._api).render(pop, note);
    new VoiceQualityChoice(this._api).render(pop, note);
    return pop;
  }

  static _setupIntro(read, where) {
    return read
      ? '<div class="cm-voice-pop-title">Set up read aloud</div>'
        + '<div class="cm-voice-pop-body">Reading replies aloud needs a small speech engine '
        + 'and a voice. Everything runs ' + where + '.</div>'
      : '<div class="cm-voice-pop-title">Set up voice conversation</div>'
        + '<div class="cm-voice-pop-body">Talking with the model needs two small engines. '
        + 'Everything runs ' + where + '.</div>';
  }
}
