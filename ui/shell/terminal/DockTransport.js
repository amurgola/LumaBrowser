export default class DockTransport {
  static EVENT_CHANNEL = 'core.terminal.event';

  constructor(ipc, start = {}) {
    this._ipc = ipc;
    this._start = start;
    this._id = null;
    this._joining = false;
    this._early = [];
    this._listener = null;
    this._off = null;
  }

  get sessionId() {
    return this._id;
  }

  attach(size) {
    return this._join(() => this._ipc.invoke('core.terminal.attach', { ...this._start, id: this._id, size }));
  }

  restart(size) {
    return this._join(() => this._ipc.invoke('core.terminal.restart', { id: this._id, size }));
  }

  input(data) {
    this._ipc.invoke('core.terminal.input', { id: this._id, data });
  }

  resize(cols, rows) {
    if (this._id) this._ipc.invoke('core.terminal.resize', { id: this._id, cols, rows });
  }

  ack(chars) {
    this._ipc.invoke('core.terminal.ack', { id: this._id, chars });
  }

  onEvent(listener) {
    this._listener = listener;
    this._off = this._ipc.on(DockTransport.EVENT_CHANNEL, (event) => this._onEvent(event));
  }

  dispose() {
    if (this._off) this._off();
    this._off = null;
    this._listener = null;
  }

  async _join(request) {
    this._joining = true;
    const joined = await request();
    if (joined && joined.session) this._id = joined.session.id;
    this._joining = false;
    for (const event of this._early.splice(0)) this._onEvent(event);
    return joined;
  }

  _onEvent(event) {
    if (!event || !this._listener) return;
    if (this._joining) return void this._early.push(event);
    if (event.id === this._id) this._listener(event);
  }
}
