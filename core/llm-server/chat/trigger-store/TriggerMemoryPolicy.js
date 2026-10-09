const TriggerPolicy = require('./TriggerPolicy');

class TriggerMemoryPolicy extends TriggerPolicy {
  static DEFAULT_RUNS = 5;
  static MAX_RUNS = 20;
  static DEFAULT_CHARS = 4000;
  static MIN_CHARS = 200;
  static MAX_CHARS = 16000;

  static normalize(memory) {
    if (!memory) return null;
    const m = typeof memory === 'object' ? memory : {};
    const P = TriggerMemoryPolicy;
    const runs = TriggerPolicy.clampedInt(m.runs, 0, P.MAX_RUNS);
    const maxChars = TriggerPolicy.clampedInt(m.maxChars, P.MIN_CHARS, P.MAX_CHARS);
    return { runs: runs === null ? P.DEFAULT_RUNS : runs, maxChars: maxChars === null ? P.DEFAULT_CHARS : maxChars };
  }

  static normalizeInto(source, out) {
    const memory = TriggerMemoryPolicy.normalize(source.memory);
    if (memory) out.memory = memory;
    return out;
  }

  static of(trigger) {
    return TriggerMemoryPolicy.normalize(TriggerPolicy.sourceOf(trigger).memory);
  }

  static capNotes(trigger, text) {
    const maxChars = (TriggerMemoryPolicy.of(trigger) || { maxChars: TriggerMemoryPolicy.DEFAULT_CHARS }).maxChars;
    const notes = String(text == null ? '' : text).trim();
    return notes.length > maxChars ? notes.slice(0, maxChars - 1) + String.fromCharCode(0x2026) : notes;
  }
}

module.exports = TriggerMemoryPolicy;
