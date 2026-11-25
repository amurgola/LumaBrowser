class GuestConversationMeta {
  constructor(data = {}) {
    this._data = {};
    for (const [key, value] of Object.entries(data || {})) {
      if (value && typeof value === 'object') this._data[key] = value;
    }
  }

  getMeta() {
    return { data: { ...this._data } };
  }

  setMeta(_conversationId, patch) {
    this._data = { ...((patch && patch.data) || {}) };
  }
}

module.exports = GuestConversationMeta;
