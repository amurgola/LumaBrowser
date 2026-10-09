const CastResolver = require('../world/CastResolver');
const SceneLocator = require('../world/SceneLocator');
const CurrentState = require('../world/CurrentState');
const RoleplayIds = require('../world/RoleplayIds');
const OutfitWardrobe = require('../pipeline/OutfitWardrobe');

class StageReconciler {
  static apply(data, ex, delta) {
    StageReconciler._characters(data, ex.characters, delta);
    if (ex.location) StageReconciler._location(data, ex.location, delta);
    if (ex.currentState) StageReconciler._presentCast(data, ex.currentState, delta);
    else if (data.currentState && data.currentState.sceneId !== data.activeSceneId) {
      data.currentState.sceneId = data.activeSceneId || data.currentState.sceneId || null;
      delta.changed = true;
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

  static _presentCast(data, state, delta) {
    const sceneId = StageReconciler._stateScene(data, state, delta);
    const entries = [];
    for (const sc of state.characters || []) {
      const entry = StageReconciler._presentEntry(data, sc, delta);
      if (entry) entries.push(entry);
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

  static _presentEntry(data, sc, delta) {
    let char = CastResolver.byName(data, sc.name);
    if (!char && sc.present !== false) char = delta.addCharacter(data, { name: sc.name });
    if (!char || sc.present === false) return null;
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
}

module.exports = StageReconciler;
