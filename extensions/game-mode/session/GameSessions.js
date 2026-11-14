const GameKind = require('./GameKind');
const GameScaffold = require('./GameScaffold');

class GameSessions {
  static EDITING = 'editing';
  static READY = 'ready';
  static ERROR = 'error';
  static STOPPED = 'stopped';

  static ensure({ context, conversationId, sessions, gameDir, name, kind }) {
    const existing = sessions.get(conversationId);
    if (existing && existing.workspaceId) return existing;
    const gameKind = GameKind.normalize(kind);
    GameScaffold.writeMissing(gameDir, name, gameKind);
    const record = GameSessions._newRecord(context.code.openProject({ path: gameDir }), gameKind);
    sessions.set(conversationId, record);
    return record;
  }

  static statusAfterTurn(session, aborted) {
    if (aborted) return GameSessions.STOPPED;
    const hasBadFile = [...session.files.values()].some((file) => !(file && file.ok));
    return hasBadFile ? GameSessions.ERROR : GameSessions.READY;
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
      status: GameSessions.EDITING,
    };
  }
}

module.exports = GameSessions;
