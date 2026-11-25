const { EventEmitter } = require('events');
const NotificationRecord = require('./NotificationRecord');

class NotificationWatcher extends EventEmitter {
  static INTERVAL_MS = 2000;

  constructor(shell, { intervalMs = NotificationWatcher.INTERVAL_MS } = {}) {
    super();
    this._shell = shell;
    this._intervalMs = intervalMs;
    this._active = new Map();
    this._timer = null;
    this._polling = false;
  }

  async start() {
    await this.poll({ announce: false });
    this._timer = setInterval(() => { this.poll({ announce: true }).catch(() => {}); }, this._intervalMs);
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
  }

  list() {
    return [...this._active.values()];
  }

  async poll({ announce }) {
    if (this._polling) return;
    this._polling = true;
    try {
      const keys = NotificationRecord.keysIn(await this._shell('cmd notification list'));
      await this._addNew(keys, announce);
      this._dropGone(keys, announce);
    } finally {
      this._polling = false;
    }
  }

  async _addNew(keys, announce) {
    for (const key of keys) {
      if (this._active.has(key)) continue;
      const notification = NotificationRecord.parse(key, await this._shell(`cmd notification get '${key.replace(/'/g, '')}'`));
      this._active.set(key, notification);
      if (announce) this.emit('posted', notification);
    }
  }

  _dropGone(keys, announce) {
    const current = new Set(keys);
    for (const key of [...this._active.keys()]) {
      if (current.has(key)) continue;
      this._active.delete(key);
      if (announce) this.emit('removed', key);
    }
  }
}

module.exports = NotificationWatcher;
