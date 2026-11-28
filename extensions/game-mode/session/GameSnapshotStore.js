const ConversationMeta = require('../ConversationMeta');
const AssetRenderQueue = require('../assets/AssetRenderQueue');
const GameSnapshot = require('./GameSnapshot');

class GameSnapshotStore {
  constructor({ sessions, meta = new ConversationMeta(), reconcile = (session) => AssetRenderQueue.reconcile(session) }) {
    this._sessions = sessions;
    this._meta = meta;
    this._reconcile = reconcile;
  }

  current(conversationId) {
    const session = this._liveSession(conversationId);
    if (!session) return this._stored(conversationId);
    if (this._reconcile(session)) this.save(conversationId);
    return GameSnapshotStore._of(session);
  }

  save(conversationId) {
    const session = this._liveSession(conversationId);
    const game = session ? GameSnapshotStore._of(session) : null;
    return game ? this._meta.saveGame(conversationId, game) : false;
  }

  _stored(conversationId) {
    const game = this._meta.dataFor(conversationId).game || null;
    if (!game || !Array.isArray(game.assets) || !game.assets.some((asset) => asset.status === 'pending')) return game;
    const settled = { ...game, assets: game.assets.map((asset) => (asset.status === 'pending' ? { ...asset, status: 'placeholder' } : asset)) };
    this._meta.saveGame(conversationId, settled);
    return settled;
  }

  _liveSession(conversationId) {
    const session = this._sessions.get(conversationId);
    return session && session.workspaceId ? session : null;
  }

  static _of(session) {
    try { return GameSnapshot.of(session); } catch (_) { return null; }
  }
}

module.exports = GameSnapshotStore;
