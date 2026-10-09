class BatchLanes {
  static EVENT = 'batch:state';

  constructor(tasks, emit) {
    this._lanes = tasks.map((t) => ({ id: t.id, kind: t.kind, instruction: t.instruction, status: 'queued' }));
    this._emit = emit;
  }

  publish() {
    this._send({ lanes: this._lanes.map((l) => ({ ...l })) });
  }

  setStatus(id, status) {
    const lane = this._lanes.find((l) => l.id === id);
    if (lane) lane.status = status;
    this.publish();
  }

  clear() {
    this._send(null);
  }

  _send(payload) {
    if (typeof this._emit !== 'function') return;
    try { this._emit({ type: BatchLanes.EVENT, payload }); } catch (_) {}
  }
}

module.exports = BatchLanes;
