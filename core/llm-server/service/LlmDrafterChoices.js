const SettingsMapStore = require('./SettingsMapStore');

class LlmDrafterChoices extends SettingsMapStore {
  static STORAGE_KEY = 'core.llmServer.modelDrafters';

  static AUTO = 'auto';

  static OFF = 'off';

  static FILE = 'file';

  static MTP = 'mtp';

  constructor(settingsDb) {
    super(settingsDb, LlmDrafterChoices.STORAGE_KEY);
  }

  static normalize(choice) {
    if (!choice || typeof choice !== 'object') return null;
    if (choice.mode === LlmDrafterChoices.OFF) return { mode: LlmDrafterChoices.OFF };
    if (choice.mode === LlmDrafterChoices.MTP) return { mode: LlmDrafterChoices.MTP };
    if (choice.mode === LlmDrafterChoices.FILE && typeof choice.path === 'string' && choice.path) {
      return { mode: LlmDrafterChoices.FILE, path: choice.path };
    }
    return null;
  }

  static keyOf(choice) {
    const clean = LlmDrafterChoices.normalize(choice);
    if (!clean) return LlmDrafterChoices.AUTO;
    return clean.mode === LlmDrafterChoices.FILE ? `file:${clean.path}` : clean.mode;
  }

  all() {
    const out = {};
    for (const [key, value] of Object.entries(this._read())) {
      const clean = LlmDrafterChoices.normalize(value);
      if (clean) out[key] = clean;
    }
    return out;
  }

  get(key) {
    return this.all()[key] || null;
  }

  set(key, choice) {
    if (!key) return this.all();
    const entries = this.all();
    const clean = LlmDrafterChoices.normalize(choice);
    if (clean) entries[key] = clean;
    else delete entries[key];
    this._write(entries);
    return entries;
  }
}

module.exports = LlmDrafterChoices;
