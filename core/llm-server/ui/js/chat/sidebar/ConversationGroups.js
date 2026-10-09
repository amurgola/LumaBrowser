export default class ConversationGroups {
  static DAY_MS = 86400000;

  static PINNED = 'Pinned';

  static label(iso, now) {
    const age = (now == null ? Date.now() : now) - new Date(iso).getTime();
    const day = ConversationGroups.DAY_MS;
    if (age < day) return 'Today';
    if (age < 2 * day) return 'Yesterday';
    if (age < 8 * day) return 'Previous 7 days';
    return 'Older';
  }

  static groupOf(conv, now) {
    return conv.pinned ? ConversationGroups.PINNED : ConversationGroups.label(conv.updatedAt, now);
  }

  static group(list, now) {
    const groups = new Map();
    for (const c of list || []) {
      const g = ConversationGroups.groupOf(c, now);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(c);
    }
    return groups;
  }
}
