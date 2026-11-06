const PaletteMatcher = require('../PaletteMatcher');
const ExtensionEntries = require('./ExtensionEntries');

class SettingsProvider {
  static SURFACE_LABELS = { shell: 'Settings', setup: 'LLM Setup', tune: 'Chat', extension: 'Settings' };
  static WEIGHTS = { label: 1, keywords: 0.85, path: 0.6, description: 0.5 };
  static GROUP_PENALTY = 0.9;

  constructor({ catalogs = [], listExtensions = () => [] } = {}) {
    this._static = catalogs.flat();
    this._listExtensions = listExtensions;
  }

  entries() {
    let ext = [];
    try { ext = ExtensionEntries.fromList(this._listExtensions()); } catch (_) {}
    return [...this._static, ...ext];
  }

  byId(id) {
    return this.entries().find((e) => e.id === id) || null;
  }

  search(query, { limit = 8 } = {}) {
    const hits = [];
    for (const entry of this.entries()) {
      const m = PaletteMatcher.score(query, SettingsProvider._fields(entry));
      if (!m) continue;
      const score = (entry.kind === 'page' || entry.kind === 'section') ? m.score * SettingsProvider.GROUP_PENALTY : m.score;
      hits.push({ entry, score, marks: m.marks });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit).map((h) => SettingsProvider.item(h.entry, h.score, h.marks));
  }

  static _fields(entry) {
    const w = SettingsProvider.WEIGHTS;
    return [
      { text: entry.label, weight: w.label },
      { text: (entry.keywords || []).join(' '), weight: w.keywords },
      { text: (entry.path || []).join(' '), weight: w.path },
      { text: entry.description, weight: w.description },
    ];
  }

  static breadcrumb(entry) {
    const surface = SettingsProvider.SURFACE_LABELS[entry.target && entry.target.surface] || 'Settings';
    const path = (entry.path || []).filter((p) => p && p !== entry.label);
    return [surface, ...path].join(' › ');
  }

  static item(entry, score = 0, marks = []) {
    return {
      kind: 'setting',
      id: entry.id,
      title: entry.label,
      subtitle: SettingsProvider.breadcrumb(entry),
      detail: entry.description || '',
      marks,
      score,
      settingKind: entry.kind || null,
    };
  }
}

module.exports = SettingsProvider;
