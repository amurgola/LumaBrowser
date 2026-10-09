export default class SetupHooks {
  static from(opts) {
    const o = opts || {};
    return {
      isCanceled: o.isCanceled || (() => false),
      phase: o.onPhase || (() => {}),
      setBar: o.onBar || (() => {}),
      sub: o.onSub || (() => {}),
    };
  }

  static async during(subscribe, listener, action) {
    const off = subscribe(listener);
    try {
      return await action();
    } finally {
      try { if (off) off(); } catch (_) {}
    }
  }
}
