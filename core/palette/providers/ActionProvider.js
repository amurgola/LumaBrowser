const PaletteMatcher = require('../PaletteMatcher');
const ActionCatalog = require('../catalog/ActionCatalog');

class ActionProvider {
  constructor({ actions = ActionCatalog } = {}) {
    this._actions = actions;
  }

  byId(id) {
    return this._actions.find((a) => a.id === id) || null;
  }

  search(query, { limit = 4 } = {}) {
    const hits = [];
    for (const action of this._actions) {
      const m = PaletteMatcher.score(query, [{ text: action.label, weight: 1 }, { text: (action.keywords || []).join(' '), weight: 0.8 }]);
      if (m) hits.push({ action, m });
    }
    hits.sort((a, b) => b.m.score - a.m.score);
    return hits.slice(0, limit).map(({ action, m }) => ({
      kind: 'action',
      id: action.id,
      title: action.label,
      subtitle: 'Command',
      hint: action.keys || '',
      marks: m.marks,
      score: m.score,
    }));
  }
}

module.exports = ActionProvider;
