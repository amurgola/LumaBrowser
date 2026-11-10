const CastResolver = require('../world/CastResolver');
const SceneLocator = require('../world/SceneLocator');
const CurrentState = require('../world/CurrentState');
const RoleplayIds = require('../world/RoleplayIds');
const CharacterState = require('../world/CharacterState');
const CharacterChronicle = require('../world/CharacterChronicle');
const CharacterMarks = require('../world/CharacterMarks');
const CharacterProfile = require('../world/CharacterProfile');
const StoryLedger = require('../world/StoryLedger');
const OutfitWardrobe = require('../pipeline/OutfitWardrobe');

class StageReconciler {

  static apply(data, ex, delta, turn = {}) {
    StageReconciler._characters(data, ex.characters, delta);
    if (ex.location) StageReconciler._location(data, ex.location, delta);
    if (ex.currentState) StageReconciler._presentCast(data, ex.currentState, delta, turn);
    else if (data.currentState && data.currentState.sceneId !== data.activeSceneId) {
      data.currentState.sceneId = data.activeSceneId || data.currentState.sceneId || null;
      delta.changed = true;
    }
    if (ex.chronicle) StageReconciler._chronicle(data, ex.chronicle, delta, turn);
    if (ex.currentState) StageReconciler._reveals(data, ex.currentState, delta, turn);
    StageReconciler._dropDead(data, delta);
  }

  static _dropDead(data, delta) {
    const moment = data.currentState && Array.isArray(data.currentState.characters) ? data.currentState.characters : null;
    if (!moment) return;
    const kept = moment.filter((e) => {
      const char = e && (CastResolver.byName(data, e.name) || (data.characters || []).find((c) => c && c.id === e.charId));
      return !(char && StageReconciler.isDead(char));
    });
    if (kept.length !== moment.length) { data.currentState.characters = kept; delta.changed = true; }
  }

  static _reveals(data, state, delta, turn) {
    for (const sc of state.characters || []) {
      if (!sc || !sc.revealed) continue;
      const char = CastResolver.byName(data, sc.name);
      if (char && StageReconciler._secretOut(data, char, turn)) delta.changed = true;
    }
  }

  static _characters(data, newChars, delta) {
    for (const ec of newChars) {
      const char = data.characters.find((c) => c.name && c.name.toLowerCase() === ec.name.toLowerCase());
      if (!char) {
        delta.addCharacter(data, { name: ec.name, description: ec.personality || '', appearance: ec.looks || '' });
        continue;
      }
      if (!char.appearance && ec.looks) { char.appearance = ec.looks; delta.changed = true; }
      if (!char.description && ec.personality) { char.description = ec.personality; delta.changed = true; }
    }
  }

  static _location(data, loc, delta) {
    const match = SceneLocator.byName(data, loc.name);
    if (match) {
      if (data.activeSceneId !== match.id) { data.activeSceneId = match.id; delta.sceneChanged = true; delta.changed = true; }
      if (!match.description && loc.desc) { match.description = loc.desc; delta.changed = true; }
      return;
    }
    if (!(loc.isNew || !data.scenes.length)) return;
    const id = RoleplayIds.mint('scene');
    data.scenes.push({ id, name: loc.name, description: loc.desc || '', bg: null });
    data.activeSceneId = id;
    delta.newSceneId = id;
    delta.sceneChanged = true;
    delta.changed = true;
  }

  static _presentCast(data, state, delta, turn) {
    const sceneId = StageReconciler._stateScene(data, state, delta);
    const entries = [];
    const presentIds = new Set();
    for (const sc of state.characters || []) {
      const entry = StageReconciler._presentEntry(data, sc, delta, sceneId, turn);
      if (entry) { entries.push(entry); presentIds.add(entry.charId); }
    }
    const prior = new Map(CastResolver.currentEntries(data).map((e) => [e.char.id, e.state]));
    for (const char of StageReconciler._departures(data, state, presentIds, sceneId, delta, turn)) {
      const was = prior.get(char.id);
      entries.push(Object.assign({ charId: char.id, name: char.name, present: true }, was || {}));
    }
    if (CurrentState.replace(data, { sceneId, characters: entries })) delta.changed = true;
  }

  static _stateScene(data, state, delta) {
    let sceneId = data.activeSceneId || null;
    const stateScene = state.scene && SceneLocator.byName(data, state.scene);
    if (stateScene) sceneId = stateScene.id;
    if (sceneId && data.activeSceneId !== sceneId) {
      data.activeSceneId = sceneId;
      delta.sceneChanged = true;
      delta.changed = true;
    }
    return sceneId;
  }

  static _presentEntry(data, sc, delta, sceneId, turn) {
    let char = CastResolver.byName(data, sc.name);
    if (!char && sc.present !== false) char = delta.addCharacter(data, { name: sc.name });
    if (!char) return null;
    if (StageReconciler.isDead(char)) return null;
    if (char.state && char.state.unlisted) { delete char.state.unlisted; delta.changed = true; }
    if (sc.beat && CharacterChronicle.addBeat(char, { turn: turn.turn, messageId: turn.messageId, text: sc.beat })) delta.changed = true;
    if (Array.isArray(sc.noticed) && sc.noticed.length && CharacterMarks.add(char, sc.noticed, turn.turn)) delta.changed = true;
    if (sc.bondChange && sc.bondUser && CharacterProfile.setBond(char, CharacterProfile.BOND_USER, sc.bondUser)) delta.changed = true;
    if (sc.present === false) {
      if (CharacterState.depart(char, { turn: turn.turn, sceneId, note: sc.leftTo })) delta.changed = true;
      return null;
    }
    if (CharacterState.arrive(char, sceneId, {
      emotion: sc.emotion, intent: sc.intent, condition: sc.condition, bondUser: sc.bondUser, bondNote: sc.bondChange,
    })) delta.changed = true;
    const acc = StageReconciler._wardrobe(char, sc, delta);
    const entry = {
      charId: char.id,
      name: char.name,
      present: true,
      emotion: sc.emotion || '',
      outfitDesc: sc.outfit || char.currentOutfitDesc || '',
      outfitId: char.currentOutfit || null,
    };
    if (sc.slots) entry.slots = sc.slots;
    if (acc.head || acc.face) entry.accessories = acc;
    return entry;
  }

  static isDead(char) {
    const seen = CharacterState.of(char).lastSeen;
    return !!(seen && /^dead:/i.test(String(seen.note || '')));
  }

  static _departures(data, state, presentIds, sceneId, delta, turn) {
    const before = CastResolver.currentEntries(data).map((e) => e.char);
    const named = new Set((state.characters || []).map((c) => String(c.name || '').toLowerCase()));
    const prevScene = data.currentState && data.currentState.sceneId;
    const moved = !!(prevScene && sceneId && prevScene !== sceneId);
    const kept = [];
    for (const char of before) {
      if (presentIds.has(char.id) || named.has(String(char.name || '').toLowerCase())) continue;
      if (char.state && char.state.unlisted !== undefined) { delete char.state.unlisted; delta.changed = true; }
      if (!moved) { kept.push(char); continue; }
      if (CharacterState.depart(char, { turn: turn.turn, sceneId: prevScene || sceneId, note: '' })) delta.changed = true;
    }
    return kept;
  }

  static _wardrobe(char, sc, delta) {
    if (sc.outfit && sc.outfit !== char.currentOutfitDesc) { char.currentOutfitDesc = sc.outfit; delta.changed = true; }
    if (sc.slots && JSON.stringify(sc.slots) !== JSON.stringify(char.currentSlots || null)) {
      char.currentSlots = sc.slots;
      delta.changed = true;
    }
    const acc = { head: sc.head || '', face: sc.face || '' };
    if ((acc.head || acc.face) && JSON.stringify(acc) !== JSON.stringify(char.accessories || {})) {
      char.accessories = acc;
      delta.changed = true;
    }
    if (sc.outfit && OutfitWardrobe.ensure(char, sc.outfit, delta.pendingOutfits, sc.slots)) delta.changed = true;
    return acc;
  }

  static _chronicle(data, chronicle, delta, turn) {
    if (StoryLedger.record(data, chronicle.events, turn)) delta.changed = true;
    if (chronicle.clock && StoryLedger.advanceClock(data, chronicle.clock)) delta.changed = true;
    if (chronicle.threads && StoryLedger.threads(data, chronicle.threads, turn.turn)) delta.changed = true;
    for (const e of chronicle.events || []) {
      if (e.kind === 'death') {
        for (const name of e.who || []) {
          const char = CastResolver.byName(data, name);
          if (char && CharacterState.depart(char, { turn: turn.turn, sceneId: data.activeSceneId, note: 'dead: ' + e.text })) delta.changed = true;
        }
      } else if (e.kind === 'reveal') {
        for (const name of e.who || []) {
          const char = CastResolver.byName(data, name);
          if (char && StageReconciler.tellsSecret(CharacterProfile.of(char).hides, e.text) && StageReconciler._secretOut(data, char, turn, false)) delta.changed = true;
        }
      }
    }
  }

  static _secretOut(data, char, turn, record = true) {
    const hides = CharacterProfile.of(char).hides;
    if (!hides) return false;
    CharacterProfile.apply(char, { hides: '' }, { growthOnly: true });
    if (record) {
      const rows = StoryLedger.of(data).ledger.filter((r) => r.turn === turn.turn && r.kind === 'reveal' && (r.who || []).includes(char.name));
      if (!rows.length) {
        StoryLedger.record(data, [{ kind: 'reveal', text: char.name + '\'s secret came out: ' + hides, who: [char.name] }], turn);
      }
    }
    return true;
  }

  static tellsSecret(hides, text) {
    const words = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !StageReconciler.STOP.has(w)));
    const a = words(hides);
    if (!a.size) return false;
    let shared = 0;
    for (const w of words(text)) if (a.has(w)) shared += 1;
    return shared >= Math.min(2, a.size);
  }

  static STOP = new Set(['that', 'this', 'with', 'from', 'they', 'them', 'their', 'have', 'been', 'were', 'what', 'when',
    'where', 'will', 'would', 'about', 'into', 'than', 'then', 'there', 'here', 'them', 'some', 'only', 'also', 'just',
    'does', 'player', 'himself', 'herself', 'itself', 'themselves', 'because', 'before', 'after', 'while', 'really']);
}

module.exports = StageReconciler;
