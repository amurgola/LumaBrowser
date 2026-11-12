const StagingPrompt = require('./StagingPrompt');
const StoryLedger = require('../world/StoryLedger');

class StagingParser {
  static ACTION_MAX = 160;
  static FOCUS_MAX = 2;
  static PROPS_MAX = 3;
  static EVENTS_MAX = 6;
  static THREADS_MAX = 4;
  static WHO_MAX = 4;
  static NOTICED_MAX = 4;
  static OPENED_MAX = 1;
  static BEAT_MAX = 160;
  static EVENT_MAX = 200;
  static MOOD_WORDS = 4;
  static BOND_WORDS = 4;
  static PLACEHOLDER = /^[\s([{<"']*(?:unknown|unspecified|not (?:specified|visible|described|shown|stated|mentioned|applicable)|n\/?a|none|null|undefined|tbd|\?+)[\s)\]}>"'.]*$/i;
  static SENTENCE_END = /(?<!\b(?:Mr|Mrs|Ms|Dr|St|Sr|Jr|Lt|Sgt|Capt|Prof))[.!?](?=\s)/g;
  static NOT_A_GARMENT = /\b(?:unknown|unspecified|not visible|suggest\w*|impl(?:y|ies|ied)|presumably|probably|likely|position|posture|sitting|standing|kneeling)\b/i;
  static TIMES = ['dawn', 'morning', 'midday', 'noon', 'afternoon', 'evening', 'dusk', 'night', 'late night', 'midnight'];
  static CLOCK_ADVANCES = ['none', 'minutes', 'hours', 'next-morning', 'days'];

  static parse(text) {
    const obj = StagingParser.sliceJson(text);
    if (!obj || typeof obj !== 'object') return null;
    const location = StagingParser._location(obj.location);
    return {
      characters: StagingParser._newCharacters(obj),
      location,
      currentState: StagingParser._currentState(obj, location),
      chronicle: StagingParser._chronicle(obj),
      shot: obj.shot ? StagingParser.normalizeShot(obj.shot) : null,
    };
  }

  static sliceJson(text) {
    if (!text || typeof text !== 'string') return null;
    const s = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
  }

  static normalizeShot(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const pose = String(obj.pose || '').trim().toLowerCase();
    const facing = String(obj.facing || '').trim().toLowerCase() === 'away' ? 'away' : 'camera';
    const focus = StagingParser._strings(obj.focus, StagingParser.FOCUS_MAX);
    return {
      pose: StagingPrompt.POSES.indexOf(pose) >= 0 ? pose : (facing === 'away' ? 'away' : 'standing'),
      facing,
      framing: String(obj.framing || '').trim().toLowerCase() === 'close' ? 'close' : 'full',
      focus,
      group: StagingParser._true(obj.group) || focus.length > 1,
      contact: StagingParser._true(obj.contact),
      action: String(obj.action || '').trim().slice(0, StagingParser.ACTION_MAX),
      props: StagingParser._strings(obj.props, StagingParser.PROPS_MAX),
    };
  }

  static normalizeSlots(rawSlots) {
    if (!rawSlots || typeof rawSlots !== 'object') return null;
    const slots = {
      outer: String(rawSlots.outer || '').trim(),
      top: String(rawSlots.top || '').trim(),
      bottom: String(rawSlots.bottom || '').trim(),
      feet: String(rawSlots.feet || '').trim(),
    };
    return (slots.outer || slots.top || slots.bottom || slots.feet) ? slots : null;
  }

  static _newCharacters(obj) {
    const raw = Array.isArray(obj.newCharacters) ? obj.newCharacters : (Array.isArray(obj.characters) ? obj.characters : []);
    return raw
      .map((c) => (c && typeof c === 'object' ? {
        name: String(c.name || '').trim(),
        looks: StagingParser.known(c.looks || c.appearance),
        personality: StagingParser.known(c.personality || c.persona),
        was: StagingParser.known(c.was || c.formerly),
      } : null))
      .filter((c) => c && c.name);
  }

  static _location(loc) {
    if (!(loc && typeof loc === 'object' && StagingParser.known(loc.name))) return null;
    return {
      name: StagingParser.known(loc.name),
      desc: StagingParser.known(loc.desc || loc.description),
      isNew: StagingParser._true(loc.isNew),
    };
  }

  static _currentState(obj, location) {
    const legacyState = obj.currentState || obj.current_state;
    const rawPresent = Array.isArray(obj.present) ? obj.present
      : (legacyState && Array.isArray(legacyState.characters) ? legacyState.characters : null);
    if (!rawPresent) return null;
    return {
      scene: String((location && location.name) || (legacyState && (legacyState.scene || legacyState.location)) || '').trim(),
      characters: rawPresent.map((c) => StagingParser._presentEntry(c)).filter((c) => c && c.name),
    };
  }

  static _presentEntry(c) {
    if (!c || typeof c !== 'object') return null;
    return {
      name: String(c.name || '').trim(),
      present: !(c.present === false || c.present === 'false'),
      emotion: StagingParser.phrase(c.emotion || c.mood, StagingParser.MOOD_WORDS),
      intent: StagingParser.known(c.intent),
      condition: c.condition === undefined || c.condition === null ? null : StagingParser.known(c.condition),
      bondUser: StagingParser.phrase(c.bondUser || c.bond, StagingParser.BOND_WORDS),
      bondChange: StagingParser.known(c.bondChange),
      beat: StagingParser.sentence(c.beat, StagingParser.BEAT_MAX),
      leftTo: StagingParser.known(c.leftTo),
      revealed: StagingParser._true(c.revealed),
      noticed: StagingParser._strings(c.noticed, StagingParser.NOTICED_MAX).map((n) => StagingParser.known(n)).filter(Boolean),
      outfit: StagingParser.outfit(c.outfit || c.clothing || c.clothes),
      slots: StagingParser.normalizeSlots(c.slots),
      head: String(c.head || c.headwear || '').trim(),
      face: String(c.face || c.eyewear || c.facewear || '').trim(),
      outfitChanged: StagingParser._true(c.outfitChanged) || StagingParser._true(c.changed),
    };
  }

  static _chronicle(obj) {
    const hasAny = Array.isArray(obj.events) || (obj.clock && typeof obj.clock === 'object') || (obj.threads && typeof obj.threads === 'object');
    if (!hasAny) return null;
    const pressure = typeof obj.pressure === 'string' ? StagingParser.sentence(obj.pressure, StagingParser.EVENT_MAX) : null;
    const events = (Array.isArray(obj.events) ? obj.events : [])
      .map((e) => (e && typeof e === 'object' ? {
        kind: StoryLedger.KINDS.indexOf(String(e.kind || '').toLowerCase()) >= 0 ? String(e.kind).toLowerCase() : 'event',
        text: StagingParser.sentence(e.text || e.summary, StagingParser.EVENT_MAX),
        who: StagingParser._strings(e.who, StagingParser.WHO_MAX),
      } : null))
      .filter((e) => e && e.text);
    const distinct = StagingParser.distinctEvents(events).slice(0, StagingParser.EVENTS_MAX);
    const clock = obj.clock && typeof obj.clock === 'object' ? {
      advance: StagingParser.CLOCK_ADVANCES.indexOf(String(obj.clock.advance || '').toLowerCase()) >= 0 ? String(obj.clock.advance).toLowerCase() : 'none',
      days: Number(obj.clock.days) || 0,
      timeOfDay: StagingParser.timeOfDay(obj.clock.timeOfDay),
      weather: obj.clock.weather === undefined || obj.clock.weather === null ? null : StagingParser.phrase(obj.clock.weather, 3),
    } : null;
    const threads = obj.threads && typeof obj.threads === 'object' ? {
      opened: StagingParser._strings(obj.threads.opened, StagingParser.OPENED_MAX),
      advanced: StagingParser._strings(obj.threads.advanced, StagingParser.THREADS_MAX),
      closed: StagingParser._strings(obj.threads.closed, StagingParser.THREADS_MAX),
    } : { opened: [], advanced: [], closed: [] };
    return { events: distinct, clock, threads, pressure };
  }

  static distinctEvents(events) {
    const kept = [];
    for (const e of events) {
      if (!kept.some((k) => StoryLedger.sameQuestion(k.text, e.text))) kept.push(e);
    }
    return kept;
  }

  static known(value) {
    const s = String(value === undefined || value === null ? '' : value).replace(/\s+/g, ' ').trim();
    return StagingParser.PLACEHOLDER.test(s) ? '' : s;
  }

  static phrase(value, words) {
    const first = StagingParser.known(value).split(/[;.(]| - | but | though | while /i)[0].trim();
    const kept = [];
    let used = 0;
    for (const part of first.split(/,\s*/).filter(Boolean)) {
      const n = part.split(/\s+/).length;
      if (kept.length && used + n > words) break;
      kept.push(kept.length ? part : part.split(/\s+/).slice(0, words).join(' '));
      used += n;
    }
    return kept.join(', ');
  }

  static sentence(value, max) {
    const s = StagingParser.known(value);
    if (s.length <= max) return s;
    const head = s.slice(0, max);
    let stop = -1;
    for (const m of head.matchAll(StagingParser.SENTENCE_END)) stop = m.index;
    if (stop > max * 0.4) return head.slice(0, stop + 1);
    const space = head.lastIndexOf(' ');
    return (space > 0 ? head.slice(0, space) : head).replace(/[,;:\s]+$/, '') + '.';
  }

  static outfit(value) {
    const s = StagingParser.known(value);
    if (!s) return '';
    const parts = s.split(/,\s*/).map((part) => part.replace(/\s+(?:over|with|and)\s+(?:unknown|unspecified)\b.*$/i, '').trim())
      .filter((part) => part && !StagingParser.NOT_A_GARMENT.test(part));
    return parts.join(', ');
  }

  static timeOfDay(value) {
    const s = StagingParser.known(value).toLowerCase();
    if (!s) return '';
    const hit = StagingParser.TIMES.slice().sort((a, b) => b.length - a.length).find((t) => s.includes(t));
    if (hit === 'noon') return 'midday';
    if (hit === 'midnight') return 'late night';
    return hit || '';
  }

  static _strings(list, max) {
    return Array.isArray(list) ? list.map((n) => String(n || '').trim()).filter(Boolean).slice(0, max) : [];
  }

  static _true(v) {
    return v === true || v === 'true';
  }
}

module.exports = StagingParser;
