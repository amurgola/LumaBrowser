const { session } = require('electron');
const TabKinds = require('./TabKinds');

class TabSessionCache {
  static DEFAULT_KEY = '__default__';

  static async clearAll(entries) {
    let cleared = 0;
    for (const sess of TabSessionCache._sessions(entries).values()) {
      if (await TabSessionCache._clear(sess)) cleared++;
    }
    return { success: true, sessions: cleared };
  }

  static _sessions(entries) {
    const sessions = new Map();
    TabSessionCache._addPartition(sessions, TabKinds.SHARED_PARTITION);
    for (const entry of entries) TabSessionCache._addPartition(sessions, entry.partition || '');
    sessions.set(TabSessionCache.DEFAULT_KEY, session.defaultSession);
    return sessions;
  }

  static _addPartition(sessions, partition) {
    if (sessions.has(partition)) return;
    try { sessions.set(partition, session.fromPartition(partition)); } catch (_) {}
  }

  static async _clear(sess) {
    try {
      await sess.clearCache();
      return true;
    } catch (err) {
      console.warn('TabViewManager: clearCache failed for a session:', err && err.message);
      return false;
    }
  }
}

module.exports = TabSessionCache;
