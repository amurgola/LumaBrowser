class CurrentState {
  static clone(state) {
    if (!state || typeof state !== 'object') return null;
    return {
      sceneId: state.sceneId || null,
      characters: Array.isArray(state.characters) ? state.characters.map((c) => Object.assign({}, c)) : [],
    };
  }

  static replace(data, next) {
    const prev = JSON.stringify(data.currentState || null);
    data.currentState = next;
    return prev !== JSON.stringify(data.currentState || null);
  }
}

module.exports = CurrentState;
