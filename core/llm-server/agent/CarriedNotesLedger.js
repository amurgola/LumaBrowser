class CarriedNotesLedger {
  constructor(totalBudget) {
    this._budget = totalBudget;
    this._entries = [];
    this._total = 0;
  }

  get total() {
    return this._total;
  }

  track(messages, index, notes) {
    this._entries.push({ index, notes, chars: notes.length });
    this._total += notes.length;
    this._evictOverBudget(messages);
  }

  remap(remap) {
    for (let k = this._entries.length - 1; k >= 0; k--) {
      const entry = this._entries[k];
      const index = remap(entry.index);
      if (index < 0) {
        this._total -= entry.chars;
        this._entries.splice(k, 1);
      } else {
        entry.index = index;
      }
    }
  }

  _evictOverBudget(messages) {
    while (this._total > this._budget && this._entries.length > 1) {
      const victim = this._entries.length > 2 ? 1 : 0;
      const [dropped] = this._entries.splice(victim, 1);
      CarriedNotesLedger._stripSuffix(messages[dropped.index], dropped.notes);
      this._total -= dropped.chars;
    }
  }

  static _stripSuffix(message, notes) {
    const current = String(message.content || '');
    if (notes && current.endsWith(notes)) message.content = current.slice(0, -notes.length);
  }
}

module.exports = CarriedNotesLedger;
