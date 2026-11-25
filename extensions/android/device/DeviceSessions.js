const { EventEmitter } = require('events');

class DeviceSessions extends EventEmitter {
  constructor({ startDevice, openSession }) {
    super();
    this._startDevice = startDevice;
    this._openSession = openSession;
    this._opening = new Map();
    this._open = new Map();
  }

  open(name) {
    if (this._open.has(name)) return Promise.resolve(this._open.get(name));
    if (!this._opening.has(name)) {
      this._opening.set(name, this._start(name).finally(() => this._opening.delete(name)));
    }
    return this._opening.get(name);
  }

  get(name) {
    return this._open.get(name) || null;
  }

  names() {
    return [...this._open.keys()];
  }

  async close(name) {
    const session = this._open.get(name);
    if (!session) return;
    this._open.delete(name);
    await session.stop();
  }

  async closeAll() {
    for (const name of this.names()) await this.close(name);
  }

  async _start(name) {
    const { serial } = await this._startDevice(name);
    const session = await this._openSession({ name, serial });
    session.on('posted', (notification) => this.emit('posted', name, notification));
    session.on('ended', () => { this.close(name).catch(() => {}); });
    await session.start();
    this._open.set(name, session);
    return session;
  }
}

module.exports = DeviceSessions;
