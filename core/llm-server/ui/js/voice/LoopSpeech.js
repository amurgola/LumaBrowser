export default class LoopSpeech {
  static STALE_MS = 60 * 1000;

  constructor({ api, onChunk, onSettled }) {
    this._api = api;
    this._onChunk = onChunk;
    this._onSettled = onSettled;
    this._pending = new Map();
    this._seq = 0;
    this._unsubscribe = null;
  }

  get pendingCount() {
    return this._pending.size;
  }

  listen() {
    if (!this._unsubscribe) this._unsubscribe = this._api.voice.onTtsEvent((evt) => this._onTtsEvent(evt));
  }

  speak(text) {
    const requestId = 'v-' + Date.now() + '-' + (this._seq++);
    this._pending.set(requestId, true);
    setTimeout(() => { if (this._pending.delete(requestId)) this._onSettled(); }, LoopSpeech.STALE_MS);
    this._api.voice.synthesize({ requestId, text })
      .then((r) => { if (!r || r.success === false) this._settle(requestId); })
      .catch(() => this._settle(requestId));
    return requestId;
  }

  abortAll() {
    for (const id of this._pending.keys()) this._api.voice.synthesizeAbort(id).catch(() => {});
    this._pending.clear();
  }

  _onTtsEvent(evt) {
    if (!evt || !this._pending.has(evt.requestId)) return;
    if (evt.type === 'chunk') this._onChunk(evt.requestId, evt.payload);
    else if (evt.type === 'done' || evt.type === 'error') this._settle(evt.requestId);
  }

  _settle(requestId) {
    this._pending.delete(requestId);
    this._onSettled();
  }
}
