class StoryLedger {
  static KINDS = ['event', 'reveal', 'promise', 'death', 'move', 'injury'];
  static LEDGER_MAX = 80;
  static THREADS_MAX = 8;
  static THREAD_MOVES_MAX = 24;
  static THREAD_STALE_TURNS = 8;
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
      pressure: String(s.pressure || '').trim(),
      pressureTurn: Number(s.pressureTurn) || 0,
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
    story.ledger = require('./LedgerRecall').keep(kept.concat(rows), StoryLedger.LEDGER_MAX);
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
    if (reading.weather !== undefined && reading.weather !== null && String(reading.weather).trim()) story.clock.weather = String(reading.weather).trim();
    return before !== JSON.stringify(story.clock);
  }

  static setPressure(data, text, turn) {
    const story = StoryLedger._ensure(data);
    const clean = String(text || '').trim().slice(0, StoryLedger.TEXT_MAX * 2);
    const t = Number(turn) || story.turn;
    if (story.pressure === clean && story.pressureTurn === t) return false;
    story.pressure = clean;
    story.pressureTurn = t;
    return true;
  }

  static keepPressure(data, text) {
    const story = StoryLedger._ensure(data);
    const clean = String(text || '').trim();
    if (!story.pressure || clean) return false;
    story.pressure = '';
    return true;
  }

  static threads(data, { opened = [], closed = [], advanced = [] }, turn) {
    const story = StoryLedger._ensure(data);
    const t = Number(turn) || 0;
    let changed = false;
    for (const text of closed) {
      const key = StoryLedger._norm(text);
      for (const th of story.threads) {
        if (th.open && StoryLedger._norm(th.text) === key) { th.open = false; th.closedTurn = t; changed = true; }
      }
    }
    for (const text of advanced) {
      const th = StoryLedger._find(story, text);
      if (th && th.open) { StoryLedger._touch(th, t); changed = true; }
    }
    for (const raw of opened) {
      const text = String(raw || '').trim().slice(0, StoryLedger.TEXT_MAX);
      if (!text) continue;
      const known = StoryLedger._find(story, text, { similar: true });
      if (known) {
        if (known.open) { StoryLedger._touch(known, t); changed = true; }
        continue;
      }
      story.threads.push({ text, open: true, turn: t, lastTurn: t, touched: 0, moves: [t] });
      changed = true;
    }
    if (t > 0) {
      const live = story.threads.filter((th) => !th.open || th.pinned
        || t - (Number(th.lastTurn) || Number(th.turn) || 0) < StoryLedger.THREAD_STALE_TURNS);
      if (live.length !== story.threads.length) { story.threads = live; changed = true; }
    }
    if (story.threads.filter((th) => th.open).length > StoryLedger.THREADS_MAX) {
      const keep = StoryLedger._ranked(story.threads.filter((th) => th.open)).slice(0, StoryLedger.THREADS_MAX);
      story.threads = story.threads.filter((th) => !th.open || keep.includes(th));
      changed = true;
    }
    return changed;
  }

  static pinThread(data, text, turn) {
    const story = StoryLedger._ensure(data);
    const clean = String(text || '').trim().slice(0, StoryLedger.TEXT_MAX);
    if (!clean) return false;
    const t = Number(turn) || story.turn;
    let th = StoryLedger._find(story, clean, { similar: true });
    let changed = false;
    if (!th) {
      th = { text: clean, open: true, turn: t, lastTurn: t, touched: 0, moves: [t] };
      story.threads.push(th);
      changed = true;
    } else if (!th.open) {
      th.open = true;
      delete th.closedTurn;
      changed = true;
    }
    for (const other of story.threads) {
      if (other !== th && other.pinned) { delete other.pinned; changed = true; }
    }
    if (!th.pinned) { th.pinned = true; changed = true; }
    return changed;
  }

  static pinnedThread(data) {
    const th = StoryLedger.of(data).threads.find((t) => t.open && t.pinned);
    return th ? th.text : '';
  }

  static openThreads(data) {
    return StoryLedger._ranked(StoryLedger.of(data).threads.filter((t) => t.open)).map((t) => t.text);
  }

  static threadMoves(data) {
    const turns = new Set();
    for (const th of StoryLedger.of(data).threads) {
      for (const t of Array.isArray(th.moves) ? th.moves : []) if (Number.isFinite(t)) turns.add(t);
    }
    return Array.from(turns).sort((a, b) => a - b);
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

  static _ranked(threads) {
    const score = (th) => [th.pinned ? 1 : 0, Number(th.touched) || 0, Number(th.lastTurn) || Number(th.turn) || 0];
    return threads.slice().sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return sb[i] - sa[i];
      return 0;
    });
  }

  static _touch(th, turn) {
    th.touched = (Number(th.touched) || 0) + 1;
    th.lastTurn = turn;
    const moves = Array.isArray(th.moves) ? th.moves : [];
    if (moves[moves.length - 1] !== turn) moves.push(turn);
    th.moves = moves.slice(-StoryLedger.THREAD_MOVES_MAX);
  }

  static _find(story, text, { similar = false } = {}) {
    const key = StoryLedger._norm(text);
    if (!key) return null;
    const exact = story.threads.find((th) => StoryLedger._norm(th.text) === key);
    if (exact || !similar) return exact || null;
    return story.threads.find((th) => th.open && StoryLedger.sameQuestion(th.text, text)) || null;
  }

  static SAME_SHARE = 0.5;
  static FILLER = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'are', 'was', 'be',
    'will', 'would', 'can', 'could', 'should', 'whether', 'what', 'who', 'how', 'why', 'when', 'where', 'which', 'if',
    'this', 'that', 'these', 'those', 'his', 'her', 'their', 'its', 'he', 'she', 'they', 'it', 'about', 'with', 'from',
    'by', 'as', 'into', 'given', 'before', 'after', 'once', 'does', 'do', 'did', 'has', 'have', 'had', 'not', 'really',
    'truth', 'behind', 'happened', 'going']);

  static sameQuestion(a, b) {
    const words = (s) => new Set(StoryLedger._norm(s).split(' ').map((w) => w.replace(/(?:ing|ed|es|s)$/, ''))
      .filter((w) => w.length > 2 && !StoryLedger.FILLER.has(w)));
    const x = words(a);
    const y = words(b);
    const small = Math.min(x.size, y.size);
    if (small < 2) return false;
    let shared = 0;
    for (const w of x) if (y.has(w)) shared += 1;
    return shared >= 2 && shared / small >= StoryLedger.SAME_SHARE;
  }

  static _row(e, turn, messageId) {
    if (!e || typeof e !== 'object') return null;
    const text = StoryLedger._clip(e.text, StoryLedger.TEXT_MAX);
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

  static _clip(value, max) {
    const s = String(value || '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    const head = s.slice(0, max);
    const space = head.lastIndexOf(' ');
    return (space > max * 0.5 ? head.slice(0, space) : head).replace(/[,;:\s]+$/, '') + ' …';
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
    if (typeof s.pressure !== 'string') s.pressure = '';
    if (!Number.isFinite(s.pressureTurn)) s.pressureTurn = 0;
    if (!Array.isArray(s.ledger)) s.ledger = [];
    if (!Array.isArray(s.threads)) s.threads = [];
    return s;
  }
}

module.exports = StoryLedger;
