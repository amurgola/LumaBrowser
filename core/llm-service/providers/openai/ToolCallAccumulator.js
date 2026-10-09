class ToolCallAccumulator {
  constructor() {
    this._slots = new Map();
  }

  add(delta) {
    const slot = this._slotFor(typeof delta.index === 'number' ? delta.index : 0);
    if (delta.id && !slot.id) slot.id = delta.id;
    if (delta.function?.name && !slot.name) slot.name = delta.function.name;
    const argsDelta = delta.function?.arguments || '';
    slot.argsBuffer += argsDelta;
    return { index: slot.index, id: slot.id || null, name: slot.name || null, argsDelta };
  }

  finalize() {
    return [...this._slots.keys()].sort((a, b) => a - b).map((index) => ToolCallAccumulator._finalized(this._slots.get(index)));
  }

  _slotFor(index) {
    if (!this._slots.has(index)) this._slots.set(index, { index, id: '', name: '', argsBuffer: '' });
    return this._slots.get(index);
  }

  static _finalized(slot) {
    return {
      id: slot.id || `call_${Date.now()}_${slot.index}`,
      type: 'function',
      function: { name: slot.name, arguments: slot.argsBuffer || '{}' },
      parsedArguments: ToolCallAccumulator._parsedArguments(slot.argsBuffer),
    };
  }

  static _parsedArguments(argsBuffer) {
    if (!argsBuffer) return {};
    try {
      return JSON.parse(argsBuffer);
    } catch (_) {
      return { _raw: argsBuffer };
    }
  }
}

module.exports = ToolCallAccumulator;
