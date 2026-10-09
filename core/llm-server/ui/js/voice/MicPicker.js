import MicPreference from './MicPreference.js';
import MicFailure from './MicFailure.js';
import VoiceRadioRow from './VoiceRadioRow.js';

export default class MicPicker {
  static VIRTUAL_IDS = ['default', 'communications'];

  constructor(api, probe) {
    this._api = api;
    this._probe = probe;
  }

  async render(pop, note, initialErr) {
    if (initialErr) await this._explain(initialErr, note);
    const getFill = () => pop.isConnected ? pop.querySelector('.cm-voice-meter-fill') : null;
    let selected;
    try {
      await this._probe.start(undefined, getFill);
      selected = MicPreference.savedId();
    } catch (err) {
      await this._explain(err, note);
      return;
    }
    const mics = await MicPicker._inputs();
    if (selected && !mics.some((d) => d.deviceId === selected)) { selected = ''; MicPreference.save(''); }
    this._renderRows(pop.querySelector('.cm-voice-mics'), mics, selected, note, getFill);
  }

  static async _inputs() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput' && !MicPicker.VIRTUAL_IDS.includes(d.deviceId));
    } catch (_) {
      return [];
    }
  }

  _renderRows(wrap, mics, selected, note, getFill) {
    wrap.innerHTML = '';
    wrap.appendChild(this._row('System default', '', selected, note, getFill));
    let n = 0;
    for (const d of mics) wrap.appendChild(this._row(d.label || ('Microphone ' + (++n)), d.deviceId, selected, note, getFill));
  }

  _row(label, id, selected, note, getFill) {
    return VoiceRadioRow.create({
      group: 'cm-voice-mic-sel',
      text: label,
      checked: selected === id,
      onChange: async () => {
        MicPreference.save(id);
        note.textContent = '';
        try { await this._probe.start(id, getFill); } catch (err) { await this._explain(err, note); }
      },
    }).row;
  }

  async _explain(err, note) {
    this._probe.stop();
    await MicFailure.explain(this._api, err, note);
  }
}
