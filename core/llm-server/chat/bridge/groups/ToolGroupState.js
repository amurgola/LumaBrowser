const ToolGroups = require('../../ToolGroups');
const AvailableGroups = require('./AvailableGroups');

class ToolGroupState {
  constructor({ allows, extTools, kbHasDocs, chatStore, conversationId, forcedActive = [] }) {
    this._kbHasDocs = kbHasDocs;
    this._chatStore = chatStore || null;
    this._conversationId = conversationId;
    this.available = AvailableGroups.for(allows, extTools, { kbHasDocs });
    this.availableKeys = new Set(this.available.map((g) => g.key));
    this.active = new Set(this._persistedKeys());
    for (const name of forcedActive) this.active.add(name);
  }

  activate(keys) {
    let changed = false;
    for (const key of keys) {
      if (this.availableKeys.has(key) && !this.active.has(key)) {
        this.active.add(key);
        changed = true;
      }
    }
    if (changed) this._persist();
    return changed;
  }

  refresh(allows, extTools) {
    this.available = AvailableGroups.for(allows, extTools, { kbHasDocs: this._kbHasDocs });
    for (const g of this.available) this.availableKeys.add(g.key);
  }

  docsFor(keys) {
    return this.available.filter((g) => keys.includes(g.key)).map((g) => g.doc).join('\n\n');
  }

  owningGroups(name) {
    return this.available.filter((g) => g.tools && g.tools.includes(name)).map((g) => g.key);
  }

  groupFor(name) {
    return ToolGroups.groupForTool(name, this.available);
  }

  keysOwning(names) {
    const wanted = new Set(names);
    return this.available.filter((g) => g.tools.some((n) => wanted.has(n))).map((g) => g.key);
  }

  _persistedKeys() {
    try {
      if (!this._chatStore || !this._conversationId) return [];
      const data = this._chatStore.getMeta(this._conversationId).data || {};
      return Array.isArray(data.activeToolGroups) ? data.activeToolGroups : [];
    } catch (_) {
      return [];
    }
  }

  _persist() {
    try {
      const store = this._chatStore;
      if (!store || !this._conversationId) return;
      if (store.getConversation && !store.getConversation(this._conversationId)) return;
      const meta = store.getMeta(this._conversationId);
      store.setMeta(this._conversationId, { data: { ...(meta.data || {}), activeToolGroups: [...this.active] } });
    } catch (_) {}
  }
}

module.exports = ToolGroupState;
