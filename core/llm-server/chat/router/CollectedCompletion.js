class CollectedCompletion {
  constructor(dispatch) {
    this._dispatch = dispatch;
  }

  static abortError() {
    const err = new Error('complete aborted');
    err.name = 'AbortError';
    return err;
  }

  run({ modelRef, messages, temperature, images = [], extra = null, timeoutMs, timeoutMessage, signal = null }) {
    return new Promise((resolve, reject) => {
      const state = { text: '', done: false, handle: null };
      const settle = (fn, value) => {
        if (state.done) return;
        state.done = true;
        clearTimeout(timer);
        fn(value);
      };
      const stop = () => { try { if (state.handle && state.handle.abort) state.handle.abort(); } catch (_) {} };
      const timer = setTimeout(() => { if (!state.done) { settle(reject, new Error(timeoutMessage)); stop(); } }, timeoutMs);
      if (signal) {
        if (signal.aborted) { settle(reject, CollectedCompletion.abortError()); return; }
        signal.addEventListener('abort', () => { if (!state.done) { settle(reject, CollectedCompletion.abortError()); stop(); } }, { once: true });
      }
      const hooks = CollectedCompletion._hooks(state, (text) => settle(resolve, text), (err) => settle(reject, err));
      this._start(modelRef, messages, temperature, hooks, images, extra).then(
        (handle) => { state.handle = handle; if (state.done) stop(); },
        (err) => settle(reject, err),
      );
    });
  }

  _start(modelRef, messages, temperature, hooks, images, extra) {
    try {
      return Promise.resolve(this._dispatch(modelRef, messages, temperature, hooks, images, null, extra));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static _hooks(state, onText, onError) {
    return {
      onDelta: (t) => { if (t) state.text += t; },
      onReasoningDelta: () => {},
      onUsage: () => {},
      onStatus: () => {},
      onDone: () => onText(state.text),
      onError: (e) => onError(e instanceof Error ? e : new Error(String(e))),
    };
  }
}

module.exports = CollectedCompletion;
