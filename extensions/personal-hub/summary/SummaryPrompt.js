class SummaryPrompt {
  static ITEM_CHARS = 320;
  static HEADLINE_CHARS = 90;
  static SUMMARY_CHARS = 600;
  static REASON_CHARS = 160;
  static MAX_ASKS = 4;
  static SNAPSHOT_CHARS = 1500;

  static SYSTEM = [
    'You keep one person on top of their notifications so they can protect their focus.',
    'You are given the recent activity of ONE context of their work (a company or an area of life): chat messages, mail, calendar and task notices, newest first.',
    'Most of it needs nothing from them. Your job is to rule things out and say plainly what is going on.',
    'Reply with ONLY a JSON object, no prose around it:',
    '{"headline": string, "summary": string, "needsYou": boolean, "reason": string, "asks": [{"id": string, "what": string}]}',
    '- headline: at most 12 words, the single most useful thing to know.',
    '- summary: 1 to 3 short sentences covering the activity as a whole. Name people and subjects. No filler, no advice.',
    '- needsYou: true only when someone is waiting on this person for a reply, a decision or an action, or something is failing that they own. FYI messages, automated notices, newsletters and chatter between other people are false.',
    '- reason: when needsYou is true, one short sentence saying who is waiting and for what. Otherwise "".',
    '- asks: at most 4 items that each need this person, "id" copied exactly from the [id] of the item, "what" the action in a few words. Empty when needsYou is false.',
    'An item may be followed by "Conversation:" lines: that is the conversation itself as read from their own screen. Trust it over the one-line notification, and use it to tell whether a question was already answered.',
    'People are named as this person knows them; "(also on ...)" means the same person writes from those apps too.',
    'Only use what the items say. If the text of an item is too thin to tell, do not guess that it needs them.',
  ].join('\n');

  static messages(context, items, { now = new Date() } = {}) {
    const lines = items.map((item) => SummaryPrompt._itemLine(item, now));
    const user = [
      `Context: ${context.name}`,
      `Now: ${now.toISOString()}`,
      `Activity (${items.length} item${items.length === 1 ? '' : 's'}, newest first):`,
      ...lines,
    ].join('\n');
    return [{ role: 'system', content: SummaryPrompt.SYSTEM }, { role: 'user', content: user }];
  }

  static parse(text, items) {
    const raw = SummaryPrompt._json(text);
    if (!raw || typeof raw !== 'object') return null;
    const headline = SummaryPrompt._clip(raw.headline, SummaryPrompt.HEADLINE_CHARS);
    const summary = SummaryPrompt._clip(raw.summary, SummaryPrompt.SUMMARY_CHARS);
    if (!headline && !summary) return null;
    const known = new Set(items.map((item) => item.id));
    const asks = (Array.isArray(raw.asks) ? raw.asks : [])
      .map((ask) => ({ threadId: String((ask && ask.id) || '').replace(/^\[|\]$/g, ''), what: SummaryPrompt._clip(ask && ask.what, SummaryPrompt.REASON_CHARS) }))
      .filter((ask) => known.has(ask.threadId) && ask.what)
      .slice(0, SummaryPrompt.MAX_ASKS);
    const needsYou = raw.needsYou === true || raw.needsYou === 'true';
    return {
      headline: headline || summary,
      summary,
      needsYou,
      reason: needsYou ? SummaryPrompt._clip(raw.reason, SummaryPrompt.REASON_CHARS) : '',
      asks: needsYou ? asks : [],
    };
  }

  static _itemLine(item, now) {
    const last = item.lastNotification || {};
    const people = (item.people || item.participants || []).join(', ');
    const facts = [SummaryPrompt._ago(item.lastAt, now)];
    if (item.count > 1) facts.push(`${item.count} notifications`);
    if (item.priority && item.priority !== 'normal') facts.push(`marked ${item.priority}`);
    if (item.taskId) facts.push('already a task on their board');
    const text = SummaryPrompt._clip(item.summary || last.body || last.title, SummaryPrompt.ITEM_CHARS);
    const title = item.title || people || '(untitled)';
    const line = `- [${item.id}] ${item.kind || 'other'}/${item.app}: "${title}"${people && people !== title ? ` with ${people}` : ''} (${facts.join('; ')})${text ? `: ${text}` : ''}`;
    return item.snapshot ? `${line}\n${SummaryPrompt._conversation(item.snapshot)}` : line;
  }

  static _conversation(text) {
    const s = String(text || '').trim();
    const tail = s.length > SummaryPrompt.SNAPSHOT_CHARS ? `[...] ${s.slice(s.length - SummaryPrompt.SNAPSHOT_CHARS)}` : s;
    return `  Conversation:\n${tail.split(/\r?\n/).filter((l) => l.trim()).map((l) => `    ${l}`).join('\n')}`;
  }

  static _ago(iso, now) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 'unknown time';
    const mins = Math.max(0, Math.round((now.getTime() - t) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
  }

  static _json(text) {
    const s = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    const end = s.lastIndexOf('}');
    for (let start = s.indexOf('{'); start >= 0 && start < end; start = s.indexOf('{', start + 1)) {
      try { return JSON.parse(s.slice(start, end + 1)); } catch (_) {}
    }
    return null;
  }

  static _clip(value, max) {
    const s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return s.length > max ? `${s.slice(0, max - 3).trimEnd()}...` : s;
  }
}

module.exports = SummaryPrompt;
