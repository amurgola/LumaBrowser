const PendingToolCard = require('./PendingToolCard');

class NativeCallStream {
  constructor({ hooks, mirror }, { now = () => Date.now() } = {}) {
    this._hooks = hooks || {};
    this._mirror = mirror;
    this._now = now;
    this._slots = new Map();
    this.onDelta = (delta) => this._receive(delta);
  }

  get count() {
    return this._slots.size;
  }

  _receive(delta) {
    if (!delta) return;
    const index = Number.isInteger(delta.index) ? delta.index : 0;
    const opened = !this._slots.has(index);
    const slot = opened ? this._open(index) : this._slots.get(index);
    if (delta.name && !slot.name) slot.name = delta.name;
    slot.args += delta.argsDelta || '';
    slot.card.update(NativeCallStream._buffer(slot), opened);
  }

  _open(index) {
    if (this._mirror && !this._mirror.toolSuppressed) this._mirror.suppressForTool();
    const slot = { name: null, args: '', card: new PendingToolCard(this._hooks, { now: this._now, index }) };
    slot.card.begin(0);
    this._slots.set(index, slot);
    return slot;
  }

  static _buffer(slot) {
    const name = slot.name ? `"tool": "${slot.name}", ` : '';
    return `{${name}"params": ${slot.args}`;
  }
}

module.exports = NativeCallStream;
