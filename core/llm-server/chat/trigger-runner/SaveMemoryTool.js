class SaveMemoryTool {
  constructor({ triggerStore, triggerId, maxChars, onSaved = () => {} }) {
    this._store = triggerStore;
    this._triggerId = triggerId;
    this._maxChars = maxChars;
    this._onSaved = onSaved;
  }

  definition() {
    return {
      name: 'save_memory',
      description: 'Replace the notes this trigger keeps across runs with the complete updated text '
        + `(up to ${this._maxChars} characters). Call once, before your final report, with everything worth remembering.`,
      inputSchema: {
        type: 'object',
        properties: { notes: { type: 'string', description: 'The full notes to keep (replaces the previous notes)' } },
        required: ['notes'],
      },
      handler: async (params = {}) => this._save(params),
    };
  }

  _save(params) {
    const notes = String(params.notes == null ? '' : params.notes);
    const after = this._store.setMemory(this._triggerId, notes);
    this._onSaved();
    const kept = after && after.memory ? after.memory : '';
    return { success: true, chars: kept.length, truncated: !!(kept && kept.length < notes.trim().length) };
  }
}

module.exports = SaveMemoryTool;
