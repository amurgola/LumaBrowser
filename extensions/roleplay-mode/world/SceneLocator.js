class SceneLocator {
  static active(data) {
    const d = data || {};
    const scenes = Array.isArray(d.scenes) ? d.scenes : [];
    const stateSceneId = d.currentState && d.currentState.sceneId;
    return scenes.find((s) => s.id === stateSceneId)
      || scenes.find((s) => s.id === d.activeSceneId)
      || scenes[0]
      || null;
  }

  static byName(data, name) {
    const n = String(name || '').toLowerCase();
    return ((data && data.scenes) || []).find((s) => s.name && s.name.toLowerCase() === n) || null;
  }

  static label(scene) {
    const bits = scene ? [scene.name, scene.description].filter(Boolean) : [];
    return bits.filter((v, i) => bits.indexOf(v) === i).join(': ');
  }
}

module.exports = SceneLocator;
