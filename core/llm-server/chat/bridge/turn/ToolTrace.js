class ToolTrace {
  constructor() {
    this.entries = [];
  }

  get length() {
    return this.entries.length;
  }

  open(tool, params) {
    this.entries.push({ tool, params, status: 'run' });
  }

  close(evt) {
    const open = this.entries.find((x) => x.tool === evt.tool && x.status === 'run');
    if (!open) return;
    open.status = evt.success ? 'ok' : 'err';
    open.error = evt.error || null;
    open.summary = evt.summary || null;
    if (evt.meta) open.meta = evt.meta;
  }

  addFailure(tool, error) {
    this.entries.push({ tool, params: null, status: 'err', error });
  }
}

module.exports = ToolTrace;
