class SideCompletions {
  constructor(chatRouter) {
    this._router = chatRouter;
    this._streams = new Map();
  }

  async complete(args) {
    const r = await this._router.complete(SideCompletions.request(args));
    if (r && typeof r.text === 'string') return { success: true, text: r.text };
    return { success: false, error: (r && r.error) || 'completion failed' };
  }

  start(args, send) {
    const requestId = args && args.requestId;
    if (!requestId) return { success: false, error: 'requestId is required' };
    const handle = this._router.completeStream(SideCompletions.request(args), {
      onDelta: (t) => send('delta', { text: t }),
      onReasoning: (t) => send('reasoning', { text: t }),
      onDone: (full) => { this._streams.delete(requestId); send('done', { text: full }); },
      onError: (e) => { this._streams.delete(requestId); send('error', { message: e.message }); },
    });
    this._streams.set(requestId, handle);
    return { success: true };
  }

  abort(requestId) {
    const handle = this._streams.get(requestId);
    if (handle) {
      this._streams.delete(requestId);
      try { handle.abort(); } catch (_) {}
    }
    return { success: true };
  }

  static request(args) {
    const { messages, temperature, modelRef, timeoutMs, noThink } = args || {};
    return { messages, temperature, modelRef, timeoutMs, noThink };
  }
}

module.exports = SideCompletions;
