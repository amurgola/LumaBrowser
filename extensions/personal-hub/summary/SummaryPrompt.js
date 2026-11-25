const ModelText = require('../ModelText');

class SummaryPrompt {
  static ITEM_CHARS = 320;
  static HEADLINE_CHARS = 90;
  static SUMMARY_CHARS = 600;
  static REASON_CHARS = 160;
  static MAX_ASKS = 4;
  static SNAPSHOT_CHARS = 1500;
  static MAX_WHO = 12;
  static MAX_ATTENDEES = 6;
  static MAX_EARLIER = 8;
  static EARLIER_CHARS = 280;
  static EARLIER_BUDGET = 6000;
  static MAX_MORE = 3;

  static SYSTEM = [
    'You keep one person on top of their notifications so they can protect their focus.',
    'You are given the recent activity of ONE context of their work (a company or an area of life): chat messages, mail, calendar and task notices, newest first.',
    'Most of it needs nothing from them. Your job is to rule things out and say plainly what is going on.',
    'Reply with ONLY a JSON object, no prose around it:',
    '{"headline": string, "summary": string, "needsYou": boolean, "reason": string, "asks": [{"id": string, "what": string}]}',
    '- headline: at most 12 words, the single most useful thing to know.',
    '- summary: 1 to 3 short sentences covering the activity as a whole. Name people and subjects. No filler, no advice. Say what a message is about, not how it sounds: "thanked them for fixing the export", not "sent a cheerful message".',
    '- needsYou: true only when someone is waiting on this person for a reply, a decision or an action, or something is failing that they own. FYI messages, automated notices, newsletters and chatter between other people are false.',
    '- reason: when needsYou is true, one short sentence saying who is waiting and for what. Otherwise "".',
    '- asks: at most 4 items that each need this person, "id" copied exactly from the [id] of the item, "what" the action in a few words. Empty when needsYou is false.',
    'A mail item gives its subject and who it is from.',
    'An item may be followed by "Earlier:" lines: what else arrived in the same conversation before its newest message, oldest first. Read the newest message in their light: a "thank you" is about whatever was asked just before it. They are only what reached this person; their own replies are never among them, so thanks or relief after a request means they have already dealt with it.',
    'An item marked "they dismissed it ... ago" is one this person already looked at and put away; a newer message brought it back. Only what arrived after that is news: its newest message and its "Earlier:" lines. Its "Already seen:" lines, and whatever a "Conversation:" shows from before then, are background that explains the new messages. Write the headline and summary about the new messages only: no recap of what was asked, answered or settled before, not even to say it is settled. Bring up an already seen message only inside a sentence about a new one that cannot be understood without it, and do not count an old request as needing this person unless a new message raises it again.',
    'An item may be followed by "Conversation:" lines, or "Mail:" lines for a mail: that is the conversation or the mail itself as read from their own screen. Trust it over the one-line notification, and use it to tell whether a question was already answered.',
    'An item may be followed by "On their calendar:" lines: meetings already booked with the same subject or with just the person who wrote. When such a meeting answers what the item asks (a time to meet, a choice between days), that ask is settled: do not count it as needing them, and say the meeting is booked and when.',
    'People are named as this person knows them; "(also on ...)" means the same person writes from those apps too.',
    'A "Who is who" list may follow the activity: what this person has recorded about the people in it. Use it to judge how much a message matters to them and to say who someone is; never repeat private details that the activity itself does not call for.',
    'Only use what the items say. If the text of an item is too thin to tell, do not guess that it needs them.',
  ].join('\n');

  static MORE = [
    'You may ask to see more. Add "more": [string] to the object: the ids of at most 3 items you cannot judge from what is given, where reading the conversation or the mail itself would tell you what it is about or whether it needs this person: a mail with only a subject from a real person, a message that answers something you cannot see.',
    'The Hub will open those at their source, read them and ask you again with what it found. Ask for nothing that already has "Conversation:" or "Mail:" lines, and nothing for newsletters, promotions, automated status notices or anything already clear. "more": [] when you need nothing. Write the rest of the object from what you have now, and do not mention in it that you asked.',
  ].join('\n');

  static messages(context, items, { now = new Date(), who = [], askMore = false } = {}) {
    const earlier = SummaryPrompt._earlierBlocks(items, now);
    const lines = items.map((item, index) => SummaryPrompt._itemLine(item, now, earlier[index]));
    const user = [
      `Context: ${context.name}`,
      `Now: ${now.toISOString()}`,
      `Activity (${items.length} item${items.length === 1 ? '' : 's'}, newest first):`,
      ...lines,
      ...SummaryPrompt._whoLines(who),
    ].join('\n');
    return [{ role: 'system', content: askMore ? `${SummaryPrompt.SYSTEM}\n${SummaryPrompt.MORE}` : SummaryPrompt.SYSTEM }, { role: 'user', content: user }];
  }

  static parse(text, items) {
    const raw = ModelText.json(text);
    if (!raw || typeof raw !== 'object') return null;
    const headline = ModelText.clip(raw.headline, SummaryPrompt.HEADLINE_CHARS);
    const summary = ModelText.clip(raw.summary, SummaryPrompt.SUMMARY_CHARS);
    if (!headline && !summary) return null;
    const known = new Set(items.map((item) => item.id));
    const asks = (Array.isArray(raw.asks) ? raw.asks : [])
      .map((ask) => ({ threadId: String((ask && ask.id) || '').replace(/^\[|\]$/g, ''), what: ModelText.clip(ask && ask.what, SummaryPrompt.REASON_CHARS) }))
      .filter((ask) => known.has(ask.threadId) && ask.what)
      .slice(0, SummaryPrompt.MAX_ASKS);
    const needsYou = raw.needsYou === true || raw.needsYou === 'true';
    return {
      headline: headline || summary,
      summary,
      needsYou,
      reason: needsYou ? ModelText.clip(raw.reason, SummaryPrompt.REASON_CHARS) : '',
      asks: needsYou ? asks : [],
    };
  }

  static more(text, items) {
    const raw = ModelText.json(text);
    const known = new Set(items.map((item) => item.id));
    const asked = (raw && Array.isArray(raw.more) ? raw.more : []).map((id) => String(id || '').replace(/^\[|\]$/g, ''));
    return [...new Set(asked)].filter((id) => known.has(id)).slice(0, SummaryPrompt.MAX_MORE);
  }

  static _itemLine(item, now, earlier = '') {
    const last = item.lastNotification || {};
    const facts = [SummaryPrompt._ago(item.lastAt, now)];
    if (item.count > 1) facts.push(`${item.count} notifications`);
    if (item.priority && item.priority !== 'normal') facts.push(`marked ${item.priority}`);
    if (item.taskId) facts.push('already a task on their board');
    if (item.dismissedAt) facts.push(`they dismissed it ${SummaryPrompt._ago(item.dismissedAt, now)}`);
    const text = ModelText.clip(item.summary || last.body || last.title, SummaryPrompt.ITEM_CHARS);
    const line = `- [${item.id}] ${item.kind || 'other'}/${item.app}: ${SummaryPrompt._subject(item)} (${facts.join('; ')})${text ? `: ${text}` : ''}`;
    return [line, earlier, item.snapshot ? SummaryPrompt._conversation(item.snapshot, item.snapshotScope === 'mail') : '', SummaryPrompt._calendar(item.meetings, now)].filter(Boolean).join('\n');
  }

  static _subject(item) {
    const people = (item.people || item.participants || []).join(', ');
    const title = item.title || people || '(untitled)';
    if (!people || people === title) return `"${title}"`;
    return item.kind === 'mail' ? `subject "${title}" from ${people}` : `"${title}" with ${people}`;
  }

  static _earlierBlocks(items, now) {
    let left = SummaryPrompt.EARLIER_BUDGET;
    return items.map((item) => {
      const messages = (item.earlier || []).slice(-SummaryPrompt.MAX_EARLIER);
      const block = [
        ...SummaryPrompt._earlierLines('  Already seen:', messages.filter((message) => message && message.seen), now),
        ...SummaryPrompt._earlierLines('  Earlier:', messages.filter((message) => !(message && message.seen)), now),
      ].join('\n');
      if (!block || block.length > left) return '';
      left -= block.length;
      return block;
    });
  }

  static _earlierLines(label, messages, now) {
    const lines = messages.map((message) => SummaryPrompt._earlierLine(message, now)).filter(Boolean);
    return lines.length ? [label, ...lines] : [];
  }

  static _earlierLine(message, now) {
    const text = ModelText.clip(message && message.text, SummaryPrompt.EARLIER_CHARS);
    return text ? `    - ${SummaryPrompt._ago(message.at, now)}${message.sender ? `, ${message.sender}` : ''}: ${text}` : '';
  }

  static _calendar(meetings, now) {
    const booked = (meetings || []).filter((m) => m && m.title && m.startsAt);
    if (!booked.length) return '';
    return ['  On their calendar:', ...booked.map((m) => {
      const who = (m.attendees || []).slice(0, SummaryPrompt.MAX_ATTENDEES).join(', ');
      return `    - "${ModelText.clip(m.title, SummaryPrompt.HEADLINE_CHARS)}" ${SummaryPrompt._when(m, now)}${who ? `, with ${who}` : ''}${m.organizer ? `, booked by ${m.organizer}` : ''}`;
    })].join('\n');
  }

  static _when(meeting, now) {
    const start = new Date(meeting.startsAt);
    if (Number.isNaN(start.getTime())) return '';
    const shape = meeting.allDay ? { weekday: 'short', month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    const hours = Math.round((start.getTime() - now.getTime()) / 3600000);
    const away = hours < 1 ? 'within the hour' : (hours < 24 ? `in ${hours} h` : `in ${Math.round(hours / 24)} d`);
    return `${start.toLocaleString('en-US', shape)}${meeting.allDay ? ', all day' : ''} (${away})`;
  }

  static _whoLines(who) {
    const known = (who || []).filter((person) => person && person.name && person.about).slice(0, SummaryPrompt.MAX_WHO);
    return known.length ? ['Who is who:', ...known.map((person) => `- ${person.name}: ${person.about}`)] : [];
  }

  static _conversation(text, isMail = false) {
    const s = String(text || '').trim();
    const long = s.length > SummaryPrompt.SNAPSHOT_CHARS;
    const tail = long ? `[...] ${s.slice(s.length - SummaryPrompt.SNAPSHOT_CHARS)}` : s;
    const kept = isMail && long ? `${s.slice(0, SummaryPrompt.SNAPSHOT_CHARS)} [...]` : tail;
    return `  ${isMail ? 'Mail' : 'Conversation'}:\n${kept.split(/\r?\n/).filter((l) => l.trim()).map((l) => `    ${l}`).join('\n')}`;
  }

  static _ago(iso, now) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 'unknown time';
    const mins = Math.max(0, Math.round((now.getTime() - t) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
  }
}

module.exports = SummaryPrompt;
