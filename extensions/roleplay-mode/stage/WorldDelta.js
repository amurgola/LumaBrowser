const RoleplayIds = require('../world/RoleplayIds');

class WorldDelta {
  constructor() {
    this.changed = false;
    this.newCharIds = [];
    this.newSceneId = null;
    this.sceneChanged = false;
    this.pendingOutfits = [];
  }

  addCharacter(data, fields) {
    const char = Object.assign({ id: RoleplayIds.mint('char'), description: '', appearance: '', seed: RoleplayIds.seed(), art: null }, fields);
    data.characters.push(char);
    this.newCharIds.push(char.id);
    this.changed = true;
    return char;
  }

  announcement() {
    return { newCharIds: this.newCharIds, newSceneId: this.newSceneId, sceneChanged: this.sceneChanged };
  }
}

module.exports = WorldDelta;
