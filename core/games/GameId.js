const path = require('path');

class GameId {
  static MAX_LENGTH = 64;

  static from({ exe, title } = {}) {
    const raw = exe ? path.basename(String(exe)).replace(/\.exe$/i, '') : String(title || '');
    const id = GameId._slug(raw);
    if (!GameId._isUsable(id)) throw new Error('Cannot derive a game id; pass gameId.');
    return id;
  }

  static sanitize(id) {
    const clean = GameId._slug(String(id || ''));
    if (!GameId._isUsable(clean)) throw new Error(`Invalid gameId "${id}".`);
    return clean;
  }

  static _slug(raw) {
    return raw.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, GameId.MAX_LENGTH);
  }

  static _isUsable(id) {
    return !!id && id !== '.' && id !== '..';
  }
}

module.exports = GameId;
