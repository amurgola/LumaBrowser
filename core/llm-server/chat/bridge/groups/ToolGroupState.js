const ToolGroups = require('../../ToolGroups');
const AvailableGroups = require('./AvailableGroups');

class ToolGroupState {
  constructor({ allows, extTools, kbHasDocs, chatStore, conversationId, forcedActive = [] }) {
    this._kbHasDocs = kbHasDocs;
    this._chatStore = chatStore || null;
    this._conversationId = conversationId;
    this.available = AvailableGroups.for(allows, extTools, { kbHasDocs });
    this.availableKeys = new Set(this.available.map((g) => g.key));
    this._forced = new Set(forcedActive);
    this.active = new Set(this._persistedKeys());
    for (const name of this._forced) this.active.add(name);
    const prompt = this._persistedList('promptToolGroups');
    this._promptFrozen = prompt !== null;
    this.promptKeys = new Set(prompt || []);
    for (const name of this._forced) this.promptKeys.add(name);
    this._delivered = new Set(this._persistedList('deliveredToolGroups') || []);
  }

  freezePromptKeys() {
    if (this._promptFrozen) return false;
    for (const key of this.active) this.promptKeys.add(key);
    this._promptFrozen = true;
    this._persist();
    return true;
  }

  pendingManualKeys() {
    return [...this.active].filter((key) => !this.promptKeys.has(key) && !this._delivered.has(key));
  }

  markDelivered(keys) {
    let changed = false;
    for (const key of keys || []) {
      if (!this._delivered.has(key)) {
        this._delivered.add(key);
        changed = true;
      }
    }
    if (changed) this._persist();
    return changed;
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
    return this._persistedList('activeToolGroups') || [];
  }

  _persistedList(key) {
    try {
      if (!this._chatStore || !this._conversationId) return null;
      const data = this._chatStore.getMeta(this._conversationId).data || {};
      return Array.isArray(data[key]) ? data[key] : null;
    } catch (_) {
      return null;
    }
  }

  _persist() {
    try {
      const store = this._chatStore;
      if (!store || !this._conversationId) return;
      if (store.getConversation && !store.getConversation(this._conversationId)) return;
      const meta = store.getMeta(this._conversationId);
      const notForced = (set) => [...set].filter((key) => !this._forced.has(key));
      const data = { ...(meta.data || {}), activeToolGroups: notForced(this.active) };
      if (this._promptFrozen) data.promptToolGroups = notForced(this.promptKeys);
      if (this._delivered.size) data.deliveredToolGroups = [...this._delivered];
      store.setMeta(this._conversationId, { data });
    } catch (_) {}
  }
}

module.exports = ToolGroupState;
