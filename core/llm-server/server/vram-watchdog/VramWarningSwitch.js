class VramWarningSwitch {
  static PRESSURE_EVENT = 'vram-pressure';

  constructor({ isOn, emit }) {
    this._isOn = isOn;
    this._emit = emit;
  }

  emit(type, payload) {
    if (type === VramWarningSwitch.PRESSURE_EVENT && !this._isOn()) return;
    this._emit(type, payload);
  }

  view(state) {
    if (this._isOn() || !state) return state;
    return { ...state, cards: [] };
  }

  resync(state) {
    const on = this._isOn();
    for (const card of (state && Array.isArray(state.cards) ? state.cards : [])) {
      this._emit(VramWarningSwitch.PRESSURE_EVENT, on ? card : { ...card, band: 'normal' });
    }
  }
}

module.exports = VramWarningSwitch;
