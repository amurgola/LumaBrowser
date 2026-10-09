class NativeToolCallAccumulator {
  static LOOP_REPEATS = 3;

  constructor() {
    this._slots = [];
  }

  add(fragments) {
    if (!Array.isArray(fragments)) return this;
    for (const fragment of fragments) if (fragment) this._merge(fragment);
    return this;
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

  _merge(fragment) {
    const slot = this._slotAt(Number.isInteger(fragment.index) ? fragment.index : 0);
    if (fragment.id) slot.id = fragment.id;
    const fn = fragment.function || {};
    if (typeof fn.name === 'string' && fn.name) slot.name = fn.name;
    if (typeof fn.arguments === 'string') slot.args += fn.arguments;
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
