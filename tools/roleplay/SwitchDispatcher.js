class SwitchDispatcher {
  constructor({ script, live = null } = {}) {
    this._script = script || { narrator: async () => '', side: async () => '{}' };
    this._live = live;
    this._useLive = false;
    this._observers = new Set();
    this.calls = [];
  }

  goLive(on = true) {
    if (on && !this._live) throw new Error('no live dispatcher was given');
    this._useLive = !!on;
  }

  get live() {
    return this._useLive;
  }

  observe(fn) {
    if (typeof fn !== 'function') return () => {};
    this._observers.add(fn);
    return () => { this._observers.delete(fn); };
  }

  async dispatch(ref, messages, temperature, hooks, images = [], tools = null, extra = null) {
    const { trace = null, ...rest } = extra || {};
    const request = { modelRef: ref, messages, temperature, tools, extra: Object.keys(rest).length ? rest : null, images, trace };
    this.calls.push({ ref, messages, temperature, extra, live: this._useLive });
    for (const fn of this._observers) { try { fn(request); } catch (_) {} }
    if (this._useLive) return this._live.dispatch(ref, messages, temperature, hooks, images, tools, extra);
    const chat = !!(trace && trace.callType === 'chat');
    const call = { ref, messages, temperature, extra };
    const text = chat ? await this._script.narrator(call) : await this._script.side(call);
    setImmediate(() => {
      if (text === null) { hooks.onError(new Error('the scripted model has no answer')); return; }
      if (text) hooks.onDelta(text);
      hooks.onDone({ finishReason: 'stop', usage: { prompt_tokens: 0, completion_tokens: 0 } });
    });
    return { abort() {} };
  }
}

module.exports = SwitchDispatcher;
