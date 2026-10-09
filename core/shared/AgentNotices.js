const AgentNoticeRun = require('./AgentNoticeRun');

class AgentNotices {
  static MAX_PER_CONVERSATION = 50;
  static UNTAGGED = '__untagged__';
  static STALE_RUN_MS = 60 * 60 * 1000;

  static _queues = new Map();
  static _activeRuns = new Set();

  static enqueue(conversationId, text) {
    const notice = String(text || '').trim();
    if (!notice) return;
    const queue = AgentNotices._queueFor(AgentNotices._key(conversationId));
    queue.push(notice);
    AgentNotices._trimQueue(queue);
  }

  static drain(conversationId) {
    const key = AgentNotices._key(conversationId);
    const queue = AgentNotices._queues.get(key);
    if (!queue || !queue.length) return [];
    AgentNotices._queues.delete(key);
    return queue;
  }

  static drainAll() {
    const notices = [];
    for (const queue of AgentNotices._queues.values()) notices.push(...queue);
    AgentNotices._queues.clear();
    return notices;
  }

  static pending(conversationId) {
    if (conversationId == null) return AgentNotices._countAll();
    const queue = AgentNotices._queues.get(AgentNotices._key(conversationId));
    return queue ? queue.length : 0;
  }

  static beginRun({ conversationId = null } = {}) {
    const now = Date.now();
    AgentNotices._evictStaleRuns(now);
    const run = new AgentNoticeRun(AgentNotices, conversationId, now);
    AgentNotices._activeRuns.add(run);
    return run;
  }

  static drainIfSoleRun(run) {
    const alone = AgentNotices._activeRuns.size === 1 && AgentNotices._activeRuns.has(run);
    return alone ? AgentNotices.drainAll() : [];
  }

  static endRun(run) {
    AgentNotices._activeRuns.delete(run);
  }

  static reset() {
    AgentNotices._queues.clear();
    AgentNotices._activeRuns.clear();
  }

  static _key(conversationId) {
    const id = conversationId == null ? '' : String(conversationId).trim();
    return id || AgentNotices.UNTAGGED;
  }

  static _queueFor(key) {
    if (!AgentNotices._queues.has(key)) AgentNotices._queues.set(key, []);
    return AgentNotices._queues.get(key);
  }

  static _trimQueue(queue) {
    while (queue.length > AgentNotices.MAX_PER_CONVERSATION) queue.shift();
  }

  static _countAll() {
    let count = 0;
    for (const queue of AgentNotices._queues.values()) count += queue.length;
    return count;
  }

  static _evictStaleRuns(now) {
    for (const run of AgentNotices._activeRuns) {
      if (now - run.startedAt > AgentNotices.STALE_RUN_MS) AgentNotices._activeRuns.delete(run);
    }
  }
}

module.exports = AgentNotices;
