class NativeToolCallAccumulator {
  static LOOP_REPEATS = 3;

  constructor() {
    this._slots = [];
  }

  add(fragments) {
    if (!Array.isArray(fragments)) return this;
    for (const fragment of fragments) if (fragment) this.merge(fragment);
    return this;
  }

  merge(fragment) {
    const index = Number.isInteger(fragment.index) ? fragment.index : 0;
    const slot = this._slotAt(index);
    if (fragment.id) slot.id = fragment.id;
    const fn = fragment.function || {};
    if (typeof fn.name === 'string' && fn.name) slot.name = fn.name;
    const argsDelta = typeof fn.arguments === 'string' ? fn.arguments : '';
    slot.args += argsDelta;
    return { index, id: slot.id || null, name: slot.name || null, argsDelta };
  }

  finalize() {
    return this._namedSlots();
  }

  isLooping() {
    const done = this._namedSlots().slice(0, -1);
    const repeats = NativeToolCallAccumulator.LOOP_REPEATS;
    if (done.length < repeats) return false;
    const last = NativeToolCallAccumulator._signature(done[done.length - 1]);
    return done.slice(-repeats).every((slot) => NativeToolCallAccumulator._signature(slot) === last);
  }

  _slotAt(index) {
    if (!this._slots[index]) this._slots[index] = { id: null, name: '', args: '' };
    return this._slots[index];
  }

  _namedSlots() {
    return this._slots.filter((slot) => slot && slot.name);
  }

  static _signature(slot) {
    return `${slot.name} ${slot.args || ''}`;
  }
}

module.exports = NativeToolCallAccumulator;
