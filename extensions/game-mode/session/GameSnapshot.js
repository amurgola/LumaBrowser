const fs = require('fs');
const path = require('path');
const GameKind = require('./GameKind');
const GameJson = require('./GameJson');

class GameSnapshot {
  static EVENT = 'game:state';

  static of(session) {
    return {
      id: session.id,
      kind: 'game',
      gameKind: GameSnapshot.kindOf(session),
      name: GameSnapshot.nameOf(session),
      status: session.status || 'editing',
      files: GameSnapshot._files(session),
      assets: GameSnapshot._assets(session),
      playable: fs.existsSync(path.join(session.dir, 'index.html')),
    };
  }

  static nameOf(session) {
    return GameJson.nameOf(session.dir) || path.basename(session.dir);
  }

  static kindOf(session) {
    if (session && session.gameKind) return GameKind.normalize(session.gameKind);
    return GameJson.kindOf(session.dir);
  }

  static emit(emit, session) {
    if (typeof emit !== 'function') return;
    try { emit({ type: GameSnapshot.EVENT, payload: GameSnapshot.of(session) }); } catch (_) {}
  }

  static _files(session) {
    return [...session.files.entries()].map(([p, v]) => ({ path: p, ok: !!(v && v.ok), phase: (v && v.phase) || 'done' }));
  }

  static _assets(session) {
    return [...session.assets.entries()].map(([p, v]) => ({ path: p, status: (v && v.status) || 'done' }));
  }
}

module.exports = GameSnapshot;
