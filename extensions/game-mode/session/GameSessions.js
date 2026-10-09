const GameKind = require('./GameKind');
const GameScaffold = require('./GameScaffold');

class GameSessions {
  static ensure({ context, conversationId, sessions, gameDir, name, kind }) {
    const existing = sessions.get(conversationId);
    if (existing && existing.workspaceId) return existing;
    const gameKind = GameKind.normalize(kind);
    GameScaffold.writeMissing(gameDir, name, gameKind);
    const record = GameSessions._newRecord(context.code.openProject({ path: gameDir }), gameKind);
    sessions.set(conversationId, record);
    return record;
  }

  static _newRecord(handle, gameKind) {
    return {
      workspaceId: handle.workspaceId,
      id: handle.id,
      dir: handle.dir,
      kind: 'game',
      gameKind,
      files: new Map(),
      assets: new Map(),
      readWhole: new Map(),
      pendingAssets: [],
      calls: 0,
      served: 0,
      status: 'editing',
    };
  }
}

module.exports = GameSessions;
