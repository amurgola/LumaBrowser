class StateChangeHook {
  static EVENT = 'state-change';

  static on(emitter, handler) {
    if (!emitter || typeof emitter.on !== 'function') return () => {};
    emitter.on(StateChangeHook.EVENT, handler);
    return () => StateChangeHook._off(emitter, handler);
  }

  static _off(emitter, handler) {
    try {
      if (typeof emitter.removeListener === 'function') emitter.removeListener(StateChangeHook.EVENT, handler);
      else if (typeof emitter.off === 'function') emitter.off(StateChangeHook.EVENT, handler);
    } catch (_) {}
  }
}

module.exports = StateChangeHook;
