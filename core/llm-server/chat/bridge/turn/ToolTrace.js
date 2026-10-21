class ToolTrace {
  constructor() {
    this.entries = [];
    this._open = new Map();
  }

  get length() {
    return this.entries.length;
  }

  open(tool, params, callId = null) {
    const entry = { tool, params, status: 'run' };
    this.entries.push(entry);
    if (callId != null) this._open.set(String(callId), entry);
  }

  close(evt) {
    const open = this._byId(evt.callId) || this.entries.find((x) => x.tool === evt.tool && x.status === 'run');
    if (!open) return;
    open.status = evt.success ? 'ok' : 'err';
    open.error = evt.error || null;
    open.summary = evt.summary || null;
    if (evt.meta) open.meta = evt.meta;
  }

  _byId(callId) {
    if (callId == null) return null;
    const entry = this._open.get(String(callId));
    if (entry) this._open.delete(String(callId));
    return entry && entry.status === 'run' ? entry : null;
  }

  addFailure(tool, error) {
    this.entries.push({ tool, params: null, status: 'err', error });
  }
}

module.exports = ToolTrace;
