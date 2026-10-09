const CurrentState = require('../world/CurrentState');

class TurnData {
  static from(meta) {
    const base = (meta && meta.data) || {};
    const data = Object.assign({}, base);
    data.characters = Array.isArray(base.characters) ? base.characters.map((c) => Object.assign({}, c)) : [];
    data.scenes = Array.isArray(base.scenes) ? base.scenes.map((s) => Object.assign({}, s)) : [];
    data.options = Object.assign({}, base.options || {});
    data.images = Object.assign({}, base.images || {});
    data.currentState = CurrentState.clone(base.currentState) || { sceneId: data.activeSceneId || null, characters: [] };
    data.assetRetry = Object.assign({}, base.assetRetry || {});
    return data;
  }

  static wasEmpty(meta) {
    const base = (meta && meta.data) || {};
    return !(base.characters && base.characters.length) && !(base.scenes && base.scenes.length);
  }
}

module.exports = TurnData;
