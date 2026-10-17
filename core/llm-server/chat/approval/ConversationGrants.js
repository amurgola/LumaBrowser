const ApprovalGate = require('../ApprovalGate');

class ConversationGrants {
  static IDLE_MS = 30 * 60 * 1000;
  static META_KEY = 'familyGrants';
  static TOUCH_EVERY_MS = 60 * 1000;

  constructor(store, conversationId, now = () => Date.now()) {
    this._store = store;
    this._id = conversationId;
    this._now = now;
  }

  live() {
    const at = this._now();
    return Object.entries(this._grants())
      .filter(([key, usedAt]) => ApprovalGate.isCarried(key) && at - Number(usedAt) < ConversationGrants.IDLE_MS)
      .map(([key]) => key);
  }

  touch(key) {
    if (!ApprovalGate.isCarried(key)) return;
    const grants = this._grants();
    const at = this._now();
    if (grants[key] && at - Number(grants[key]) < ConversationGrants.TOUCH_EVERY_MS) return;
    try {
      const data = this._store.getMeta(this._id).data || {};
      this._store.setMeta(this._id, { data: { ...data, [ConversationGrants.META_KEY]: { ...grants, [key]: at } } });
    } catch (_) {}
  }

  runApprovals() {
    return { granted: this.live(), onGranted: (key) => this.touch(key), onUsed: (key) => this.touch(key) };
  }

  _grants() {
    try {
      const data = this._store.getMeta(this._id).data || {};
      const grants = data[ConversationGrants.META_KEY];
      return grants && typeof grants === 'object' ? grants : {};
    } catch (_) {
      return {};
    }
  }
}

module.exports = ConversationGrants;
