const StoryLedger = require('../world/StoryLedger');
const CharacterProfile = require('../world/CharacterProfile');

class CastProbe {
  static MAX_VOICE_OVERLAP = 0.5;
  static MAX_DIALOGUE_OVERLAP = 0.4;
  static MAX_GAP = 4;
  static MIN_TURNS_FOR_INITIATIVE = 4;
  static TOP_WORDS = 15;
  static MIN_WORD = 3;
  static STOP = new Set(('the and you your yours she her hers him his they them their that this with from for not but are was were '
    + 'been have has had what when where will would could should about into than then there here some only also just does did '
    + 'our out all any can get got let say said like one two now who why how too very much more most own same off over under '
    + 'yes well okay right know think want need come came went going still even back down there').split(' '));

  static run({ data, transcript }) {
    const voice = CastProbe.voiceOverlap({ data, transcript });
    const initiative = CastProbe.initiative({ data, transcript });
    const checks = [];
    const worst = voice.pairs.reduce((m, p) => Math.max(m, p.dialogue, p.voice), 0);
    checks.push({
      id: 'cast:distinct',
      label: 'The cast sound like different people (voice and dialogue overlap at most ' + CastProbe.MAX_VOICE_OVERLAP + ')',
      ok: voice.pairs.length === 0 || voice.pairs.every((p) => p.voice <= CastProbe.MAX_VOICE_OVERLAP && p.dialogue <= CastProbe.MAX_DIALOGUE_OVERLAP),
      detail: voice.pairs.length ? 'worst pair ' + voice.worstPair + ' at ' + worst : 'fewer than two profiled speakers',
    });
    const n = (transcript || []).length;
    const enough = n >= CastProbe.MIN_TURNS_FOR_INITIATIVE;
    checks.push({
      id: 'narrator:initiative',
      label: 'The narrator advances the story unprompted (a gap of at most ' + CastProbe.MAX_GAP + ' turns, at least one unprompted move)',
      ok: !enough || (initiative.longestGap <= CastProbe.MAX_GAP && initiative.unpromptedTurns.length > 0),
      detail: enough
        ? 'moved on ' + initiative.movedTurns.length + ' of ' + n + ' turns, ' + initiative.unpromptedTurns.length + ' unprompted, longest gap ' + initiative.longestGap
        : 'too few turns to judge',
    });
    return { checks, voice, initiative };
  }

  static voiceOverlap({ data, transcript }) {
    const chars = (Array.isArray(data && data.characters) ? data.characters : []).filter((c) => c && c.name);
    const spoken = CastProbe.spokenWords(transcript);
    const subjects = chars
      .map((c) => ({ name: c.name, voice: CastProbe.words(CharacterProfile.of(c).voice), lines: spoken[c.name.toLowerCase()] || [] }))
      .filter((s) => s.voice.size || s.lines.length);
    const pairs = [];
    for (let i = 0; i < subjects.length; i += 1) {
      for (let j = i + 1; j < subjects.length; j += 1) {
        const a = subjects[i];
        const b = subjects[j];
        pairs.push({
          a: a.name, b: b.name,
          voice: CastProbe.jaccard(a.voice, b.voice),
          dialogue: CastProbe.jaccard(CastProbe.topWords(a.lines), CastProbe.topWords(b.lines)),
        });
      }
    }
    const worst = pairs.reduce((m, p) => (!m || Math.max(p.voice, p.dialogue) > Math.max(m.voice, m.dialogue) ? p : m), null);
    return { pairs, worstPair: worst ? worst.a + '/' + worst.b : '' };
  }

  static initiative({ data, transcript }) {
    const rows = StoryLedger.of(data).ledger;
    const byTurn = new Map();
    for (const r of rows) {
      const t = Number(r.turn) || 0;
      if (!byTurn.has(t)) byTurn.set(t, []);
      byTurn.get(t).push(r.text);
    }
    for (const th of StoryLedger.of(data).threads) {
      for (const t of Array.isArray(th.moves) ? th.moves : []) {
        if (!byTurn.has(t)) byTurn.set(t, []);
        byTurn.get(t).push(th.text);
      }
    }
    const n = (transcript || []).length;
    const movedTurns = [];
    const unpromptedTurns = [];
    for (const entry of transcript || []) {
      const texts = byTurn.get(entry.turn) || [];
      if (!texts.length) continue;
      movedTurns.push(entry.turn);
      const asked = CastProbe.words(entry.user);
      const unprompted = texts.some((text) => {
        let shared = 0;
        for (const w of CastProbe.words(text)) if (asked.has(w)) shared += 1;
        return shared < 2;
      });
      if (unprompted) unpromptedTurns.push(entry.turn);
    }
    let longestGap = 0;
    let gap = 0;
    for (let t = 1; t <= n; t += 1) {
      if (movedTurns.includes(t)) gap = 0; else { gap += 1; longestGap = Math.max(longestGap, gap); }
    }
    return { movedTurns, unpromptedTurns, longestGap, turns: n };
  }

  static spokenWords(transcript) {
    const out = {};
    for (const entry of transcript || []) {
      for (const para of String(entry.assistant || '').split(/\n{2,}/)) {
        const m = para.trim().match(/^\*\*\s*([^*\n:]{1,40}?)\s*:?\s*\*\*\s*:?\s*([\s\S]*)$/);
        if (!m) continue;
        const name = m[1].trim().toLowerCase();
        const quotes = m[2].match(/"[^"\n]{2,}"/g) || [];
        if (!out[name]) out[name] = [];
        for (const q of quotes) out[name].push(q.slice(1, -1));
      }
    }
    return out;
  }

  static words(text) {
    return new Set(String(text || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/)
      .map((w) => w.replace(/^'+|'+$/g, ''))
      .filter((w) => w.length >= CastProbe.MIN_WORD && !CastProbe.STOP.has(w)));
  }

  static topWords(lines) {
    const counts = new Map();
    for (const line of lines || []) {
      for (const w of String(line).toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/)) {
        const word = w.replace(/^'+|'+$/g, '');
        if (word.length < CastProbe.MIN_WORD || CastProbe.STOP.has(word)) continue;
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    }
    return new Set(Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, CastProbe.TOP_WORDS).map(([w]) => w));
  }

  static jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let shared = 0;
    for (const w of a) if (b.has(w)) shared += 1;
    const union = a.size + b.size - shared;
    return union ? Math.round((shared / union) * 100) / 100 : 0;
  }
}

module.exports = CastProbe;
