export default class StoreRecords {
  static CONVERSATIONS = 'conversations';
  static ARTIFACTS = 'artifacts';
  static NEW_TITLE = 'New chat';
  static TITLE_MAX = 60;

  static newId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  static now() {
    return new Date().toISOString();
  }

  static blankConversation({ id, mode } = {}) {
    const now = StoreRecords.now();
    return {
      id: id || StoreRecords.newId('c'), title: StoreRecords.NEW_TITLE, createdAt: now, updatedAt: now,
      pinned: false, archived: false, mode: mode || 'chat',
      modelRef: null, provider: null, toolsEnabled: false, meta: null, messages: [],
    };
  }

  static titleFrom(text) {
    return String(text).replace(/\s+/g, ' ').trim().slice(0, StoreRecords.TITLE_MAX);
  }
}
