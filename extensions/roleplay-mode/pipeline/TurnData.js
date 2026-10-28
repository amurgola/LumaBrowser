const CurrentState = require('../world/CurrentState');

class TurnData {
  static from(meta) {
    const base = (meta && meta.data) || {};
    const data = Object.assign({}, base);
    data.characters = Array.isArray(base.characters) ? base.characters.map((c) => TurnData._character(c)) : [];
    data.scenes = Array.isArray(base.scenes) ? base.scenes.map((s) => Object.assign({}, s)) : [];
    data.options = Object.assign({}, base.options || {});
    data.images = Object.assign({}, base.images || {});
    data.currentState = CurrentState.clone(base.currentState) || { sceneId: data.activeSceneId || null, characters: [] };
    data.assetRetry = Object.assign({}, base.assetRetry || {});
    data.story = TurnData._deep(base.story);
    data.protagonist = base.protagonist ? Object.assign({}, base.protagonist) : base.protagonist;
    return data;
  }

  static wasEmpty(meta) {
    const base = (meta && meta.data) || {};
    return !(base.characters && base.characters.length) && !(base.scenes && base.scenes.length);
  }

  static _character(c) {
    const out = Object.assign({}, c);
    if (c && c.profile) out.profile = TurnData._deep(c.profile);
    if (c && c.chronicle) out.chronicle = TurnData._deep(c.chronicle);
    if (c && c.state) out.state = TurnData._deep(c.state);
    return out;
  }

  static _deep(v) {
    if (v === undefined || v === null || typeof v !== 'object') return v;
    try { return JSON.parse(JSON.stringify(v)); } catch (_) { return Object.assign({}, v); }
  }
}

module.exports = TurnData;
