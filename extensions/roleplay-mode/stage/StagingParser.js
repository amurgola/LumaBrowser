const StagingPrompt = require('./StagingPrompt');
const StoryLedger = require('../world/StoryLedger');

class StagingParser {
  static ACTION_MAX = 160;
  static FOCUS_MAX = 2;
  static PROPS_MAX = 3;
  static EVENTS_MAX = 6;
  static THREADS_MAX = 4;
  static WHO_MAX = 4;
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
        looks: String(c.looks || c.appearance || '').trim(),
        personality: String(c.personality || c.persona || '').trim(),
      } : null))
      .filter((c) => c && c.name);
  }

  static _location(loc) {
    if (!(loc && typeof loc === 'object' && String(loc.name || '').trim())) return null;
    return {
      name: String(loc.name).trim(),
      desc: String(loc.desc || loc.description || '').trim(),
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
      emotion: String(c.emotion || c.mood || '').trim(),
      intent: String(c.intent || '').trim(),
      condition: c.condition === undefined || c.condition === null ? null : String(c.condition).trim(),
      bondUser: String(c.bondUser || c.bond || '').trim(),
      bondChange: String(c.bondChange || '').trim(),
      beat: String(c.beat || '').trim(),
      leftTo: String(c.leftTo || '').trim(),
      outfit: String(c.outfit || c.clothing || c.clothes || '').trim(),
      slots: StagingParser.normalizeSlots(c.slots),
      head: String(c.head || c.headwear || '').trim(),
      face: String(c.face || c.eyewear || c.facewear || '').trim(),
      outfitChanged: StagingParser._true(c.outfitChanged) || StagingParser._true(c.changed),
    };
  }

  static _chronicle(obj) {
    const hasAny = Array.isArray(obj.events) || (obj.clock && typeof obj.clock === 'object') || (obj.threads && typeof obj.threads === 'object');
    if (!hasAny) return null;
    const events = (Array.isArray(obj.events) ? obj.events : [])
      .map((e) => (e && typeof e === 'object' ? {
        kind: StoryLedger.KINDS.indexOf(String(e.kind || '').toLowerCase()) >= 0 ? String(e.kind).toLowerCase() : 'event',
        text: String(e.text || e.summary || '').trim(),
        who: StagingParser._strings(e.who, StagingParser.WHO_MAX),
      } : null))
      .filter((e) => e && e.text)
      .slice(0, StagingParser.EVENTS_MAX);
    const clock = obj.clock && typeof obj.clock === 'object' ? {
      advance: StagingParser.CLOCK_ADVANCES.indexOf(String(obj.clock.advance || '').toLowerCase()) >= 0 ? String(obj.clock.advance).toLowerCase() : 'none',
      days: Number(obj.clock.days) || 0,
      timeOfDay: String(obj.clock.timeOfDay || '').trim(),
      weather: obj.clock.weather === undefined || obj.clock.weather === null ? null : String(obj.clock.weather).trim(),
    } : null;
    const threads = obj.threads && typeof obj.threads === 'object' ? {
      opened: StagingParser._strings(obj.threads.opened, StagingParser.THREADS_MAX),
      closed: StagingParser._strings(obj.threads.closed, StagingParser.THREADS_MAX),
    } : { opened: [], closed: [] };
    return { events, clock, threads };
  }

  static _strings(list, max) {
    return Array.isArray(list) ? list.map((n) => String(n || '').trim()).filter(Boolean).slice(0, max) : [];
  }

  static _true(v) {
    return v === true || v === 'true';
  }
}

module.exports = StagingParser;
