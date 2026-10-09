const fs = require('fs');
const path = require('path');
const GameId = require('./GameId');
const GameSession = require('./GameSession');

class GameSessionStore {
  constructor({ dir, fsImpl = fs } = {}) {
    if (!dir) throw new Error('GameSessionStore needs a directory');
    this._dir = dir;
    this._fs = fsImpl;
    this._cache = new Map();
  }

  open(gameId) {
    const id = GameId.sanitize(gameId);
    if (!this._cache.has(id)) this._cache.set(id, new GameSession(this._loadProfile(id), (p) => this._write(p)));
    return this._cache.get(id);
  }

  static emptyProfile(gameId, now = new Date()) {
    const at = now.toISOString();
    return {
      gameId,
      title: '',
      exe: null,
      allowed: false,
      allowedExe: null,
      controls: {},
      notes: [],
      goals: { primary: '', secondary: '', tertiary: '' },
      macros: {},
      stepCount: 0,
      lastSummaryStep: 0,
      createdAt: at,
      updatedAt: at,
    };
  }

  _loadProfile(id) {
    const empty = GameSessionStore.emptyProfile(id);
    try {
      const raw = JSON.parse(this._fs.readFileSync(this._file(id), 'utf8'));
      return { ...empty, ...raw, goals: { ...empty.goals, ...(raw.goals || {}) }, gameId: id };
    } catch (_) {
      return empty;
    }
  }

  _write(profile) {
    const file = this._file(profile.gameId);
    this._fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    this._fs.writeFileSync(tmp, JSON.stringify(profile, null, 2));
    this._fs.renameSync(tmp, file);
  }

  _file(gameId) {
    return path.join(this._dir, gameId, 'profile.json');
  }
}

module.exports = GameSessionStore;
