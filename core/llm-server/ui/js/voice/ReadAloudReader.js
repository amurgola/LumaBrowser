import PcmScheduler from './PcmScheduler.js';

export default class ReadAloudReader {
  static IN_FLIGHT = 2;
  static STALE_MS = 60 * 1000;

  constructor({ api, onChange, scheduler = new PcmScheduler() }) {
    this._api = api;
    this._onChange = onChange;
    this._scheduler = scheduler;
    this._reader = null;
    this._generation = 0;
    this._unsubscribe = null;
  }

  get key() {
    return this._reader ? this._reader.key : null;
  }

  get state() {
    if (!this._reader) return null;
    return this._reader.started ? 'playing' : 'starting';
  }

  get active() {
    return !!this._reader;
  }

  start(key, chunks) {
    this._reader = { key, chunks, next: 0, pending: new Map(), generation: ++this._generation, started: false };
    if (!this._unsubscribe) this._unsubscribe = this._api.voice.onTtsEvent((evt) => this._onTtsEvent(evt));
    this._notify();
    this._pump();
  }

  stop() {
    const reader = this._reader;
    if (!reader) return;
    this._reader = null;
    this._scheduler.stop();
    for (const id of reader.pending.keys()) this._api.voice.synthesizeAbort(id).catch(() => {});
    reader.pending.clear();
    this._notify();
  }

  _notify() {
    if (typeof this._onChange !== 'function') return;
    try { this._onChange(this.key, this.state); } catch (_) {}
  }

  _pump() {
    const reader = this._reader;
    if (!reader) return;
    while (reader.next < reader.chunks.length && reader.pending.size < ReadAloudReader.IN_FLIGHT) {
      this._request(reader, 'r-' + reader.generation + '-' + reader.next, reader.chunks[reader.next++]);
    }
  }

  _request(reader, requestId, text) {
    reader.pending.set(requestId, true);
    setTimeout(() => {
      if (this._reader === reader && reader.pending.delete(requestId)) { this._pump(); this._maybeFinish(); }
    }, ReadAloudReader.STALE_MS);
    const giveUp = () => {
      if (this._reader !== reader) return;
      reader.next = reader.chunks.length;
      reader.pending.delete(requestId);
      this._maybeFinish();
    };
    this._api.voice.synthesize({ requestId, text })
      .then((res) => { if (!res || res.success === false) giveUp(); })
      .catch(giveUp);
  }

  _onTtsEvent(evt) {
    const reader = this._reader;
    if (!reader || !evt || !reader.pending.has(evt.requestId)) return;
    if (evt.type === 'chunk') this._play(reader, evt);
    else if (evt.type === 'done' || evt.type === 'error') {
      reader.pending.delete(evt.requestId);
      this._pump();
      this._maybeFinish();
    }
  }

  _play(reader, evt) {
    if (!this._scheduler.schedule(evt.requestId, evt.payload, () => this._maybeFinish())) return;
    if (!reader.started) { reader.started = true; this._notify(); }
  }

  _maybeFinish() {
    const reader = this._reader;
    if (!reader) return;
    if (reader.next < reader.chunks.length || reader.pending.size > 0 || this._scheduler.liveCount > 0) return;
    this._reader = null;
    this._scheduler.resetSchedule();
    this._notify();
  }
}
