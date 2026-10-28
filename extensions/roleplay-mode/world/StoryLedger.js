class StoryLedger {
  static KINDS = ['event', 'reveal', 'promise', 'death', 'move', 'injury'];
  static LEDGER_MAX = 60;
  static THREADS_MAX = 8;
  static TEXT_MAX = 200;
  static SUMMARY_EVERY_TURNS = 10;
  static SUMMARY_LEDGER_ROWS = 20;
  static TIMES = ['dawn', 'morning', 'midday', 'afternoon', 'evening', 'dusk', 'night', 'late night'];

  static of(data) {
    const d = data || {};
    const s = d.story && typeof d.story === 'object' ? d.story : {};
    const clock = s.clock && typeof s.clock === 'object' ? s.clock : {};
    return {
      turn: Number(s.turn) || 0,
      clock: { day: Number(clock.day) || 1, timeOfDay: String(clock.timeOfDay || '').trim(), weather: String(clock.weather || '').trim() },
      summary: String(s.summary || '').trim(),
      summaryTurn: Number(s.summaryTurn) || 0,
      ledger: Array.isArray(s.ledger) ? s.ledger.filter((r) => r && r.text) : [],
      threads: Array.isArray(s.threads) ? s.threads.filter((t) => t && t.text) : [],
    };
  }

  static protagonist(data) {
    const p = data && data.protagonist && typeof data.protagonist === 'object' ? data.protagonist : {};
    return {
      name: String(p.name || '').trim(),
      pronouns: String(p.pronouns || '').trim(),
      appearance: String(p.appearance || '').trim(),
      persona: String(p.persona || '').trim(),
    };
  }

  static beginTurn(data) {
    const story = StoryLedger._ensure(data);
    story.turn = (Number(story.turn) || 0) + 1;
    return story.turn;
  }

  static record(data, events, { turn, messageId }) {
    const story = StoryLedger._ensure(data);
    const rows = (Array.isArray(events) ? events : [])
      .map((e) => StoryLedger._row(e, turn, messageId))
      .filter(Boolean);
    const kept = messageId ? story.ledger.filter((r) => r && r.messageId !== messageId) : story.ledger.slice();
    const changed = rows.length > 0 || kept.length !== story.ledger.length;
    story.ledger = kept.concat(rows).slice(-StoryLedger.LEDGER_MAX);
    return changed;
  }

  static advanceClock(data, reading) {
    if (!reading || typeof reading !== 'object') return false;
    const story = StoryLedger._ensure(data);
    const before = JSON.stringify(story.clock);
    const adv = String(reading.advance || 'none').toLowerCase();
    if (adv === 'next-morning') { story.clock.day += 1; story.clock.timeOfDay = 'morning'; }
    else if (adv === 'days') { story.clock.day += Math.max(1, Number(reading.days) || 1); }
    else if (adv === 'hours') story.clock.timeOfDay = StoryLedger._later(story.clock.timeOfDay, 2);
    else if (adv === 'minutes') story.clock.timeOfDay = story.clock.timeOfDay || '';
    if (reading.timeOfDay && String(reading.timeOfDay).trim()) story.clock.timeOfDay = String(reading.timeOfDay).trim().toLowerCase();
    if (reading.weather !== undefined && reading.weather !== null) story.clock.weather = String(reading.weather).trim();
    return before !== JSON.stringify(story.clock);
  }

  static threads(data, { opened = [], closed = [] }, turn) {
    const story = StoryLedger._ensure(data);
    let changed = false;
    for (const t of closed) {
      const key = StoryLedger._norm(t);
      for (const th of story.threads) {
        if (th.open && StoryLedger._norm(th.text) === key) { th.open = false; th.closedTurn = turn; changed = true; }
      }
    }
    for (const t of opened) {
      const text = String(t || '').trim().slice(0, StoryLedger.TEXT_MAX);
      if (!text || story.threads.some((th) => StoryLedger._norm(th.text) === StoryLedger._norm(text))) continue;
      story.threads.push({ text, open: true, turn });
      changed = true;
    }
    if (story.threads.filter((th) => th.open).length > StoryLedger.THREADS_MAX) {
      const open = story.threads.filter((th) => th.open);
      story.threads = story.threads.filter((th) => !th.open).concat(open.slice(-StoryLedger.THREADS_MAX));
      changed = true;
    }
    return changed;
  }

  static openThreads(data) {
    return StoryLedger.of(data).threads.filter((t) => t.open).map((t) => t.text);
  }

  static unsummarised(data) {
    const s = StoryLedger.of(data);
    return s.ledger.filter((r) => (Number(r.turn) || 0) > s.summaryTurn);
  }

  static needsSummary(data) {
    const s = StoryLedger.of(data);
    const fresh = StoryLedger.unsummarised(data);
    if (!fresh.length) return false;
    return s.turn - s.summaryTurn >= StoryLedger.SUMMARY_EVERY_TURNS || fresh.length >= StoryLedger.SUMMARY_LEDGER_ROWS;
  }

  static applySummary(data, text, turn) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const story = StoryLedger._ensure(data);
    story.summary = clean;
    story.summaryTurn = Number(turn) || story.turn;
    story.threads = story.threads.filter((t) => t.open);
    return true;
  }

  static forget(data, messageId) {
    if (!data || !data.story || !messageId) return false;
    const story = data.story;
    const before = (story.ledger || []).length;
    story.ledger = (story.ledger || []).filter((r) => !r || r.messageId !== messageId);
    return story.ledger.length !== before;
  }

  static clockLine(data) {
    const c = StoryLedger.of(data).clock;
    const bits = ['day ' + c.day];
    if (c.timeOfDay) bits.push(c.timeOfDay);
    if (c.weather) bits.push(c.weather);
    return bits.join(', ');
  }

  static _row(e, turn, messageId) {
    if (!e || typeof e !== 'object') return null;
    const text = String(e.text || '').trim().slice(0, StoryLedger.TEXT_MAX);
    if (!text) return null;
    const kind = StoryLedger.KINDS.indexOf(String(e.kind || '').toLowerCase()) >= 0 ? String(e.kind).toLowerCase() : 'event';
    const who = Array.isArray(e.who) ? e.who.map((n) => String(n || '').trim()).filter(Boolean) : [];
    return { turn: Number(turn) || 0, messageId: messageId || null, kind, text, who };
  }

  static _later(timeOfDay, steps) {
    const i = StoryLedger.TIMES.indexOf(String(timeOfDay || '').toLowerCase());
    if (i < 0) return timeOfDay || '';
    return StoryLedger.TIMES[Math.min(StoryLedger.TIMES.length - 1, i + steps)];
  }

  static _norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  }

  static _ensure(data) {
    if (!data.story || typeof data.story !== 'object') data.story = {};
    const s = data.story;
    if (!Number.isFinite(s.turn)) s.turn = 0;
    if (!s.clock || typeof s.clock !== 'object') s.clock = { day: 1, timeOfDay: '', weather: '' };
    if (!Number.isFinite(s.clock.day)) s.clock.day = 1;
    if (typeof s.summary !== 'string') s.summary = '';
    if (!Number.isFinite(s.summaryTurn)) s.summaryTurn = 0;
    if (!Array.isArray(s.ledger)) s.ledger = [];
    if (!Array.isArray(s.threads)) s.threads = [];
    return s;
  }
}

module.exports = StoryLedger;
