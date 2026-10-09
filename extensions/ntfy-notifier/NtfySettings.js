const NtfyPublisher = require('./NtfyPublisher');

class NtfySettings {
  static TRIMMED_FIELDS = ['server', 'topic', 'username'];

  constructor(db = null) {
    this._db = db;
  }

  read() {
    if (!this._db) return NtfySettings._defaults();
    return {
      server: this._text('server').trim() || NtfyPublisher.DEFAULT_SERVER,
      topic: this._text('topic').trim(),
      username: this._text('username').trim(),
      password: this._text('password'),
    };
  }

  view() {
    const config = this.read();
    return { success: true, server: config.server, topic: config.topic, username: config.username, hasPassword: !!config.password };
  }

  save(patch) {
    try {
      this._applyPatch(patch || {});
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _applyPatch(patch) {
    for (const field of NtfySettings.TRIMMED_FIELDS) {
      if (typeof patch[field] === 'string') this._db.set(field, patch[field].trim());
    }
    if (typeof patch.password === 'string') this._db.set('password', patch.password);
  }

  _text(field) {
    return String(this._db.get(field, '') || '');
  }

  static _defaults() {
    return { server: NtfyPublisher.DEFAULT_SERVER, topic: '', username: '', password: '' };
  }
}

module.exports = NtfySettings;
