const ConversationMeta = require('../ConversationMeta');
const AiBridge = require('../ai/AiBridge');
const ImageModelPins = require('../assets/ImageModelPins');
const RuntimeAssetGenerator = require('../assets/RuntimeAssetGenerator');
const GameKind = require('../session/GameKind');
const GameJson = require('../session/GameJson');
const GameSessions = require('../session/GameSessions');
const GameDataStores = require('../store/GameDataStores');

class GameAiSurface {
  constructor({ context, sessions, folders, getRouter }) {
    this._context = context;
    this._sessions = sessions;
    this._folders = folders;
    this._meta = new ConversationMeta(getRouter);
    this.bridge = new AiBridge({ chat: context.chat, ...(getRouter ? { getRouter } : {}) });
  }

  kindFor(conversationId) {
    const data = this._meta.dataFor(conversationId);
    if (data.kind) return GameKind.normalize(data.kind);
    return GameJson.kindOf(this._folders.gameDirFor(conversationId));
  }

  framingFor(conversationId) {
    return this.bridge.gameFraming(conversationId, GameJson.nameOf(this._folders.gameDirFor(conversationId)));
  }

  storeFor(conversationId) {
    return GameDataStores.forDir(this._folders.gameDirFor(conversationId));
  }

  runtimeImage(conversationId, params) {
    const data = this._meta.dataFor(conversationId);
    return RuntimeAssetGenerator.generate({
      context: this._context,
      s: this._sessionFor(conversationId, data),
      params,
      artStyle: data.artStyle || null,
      imageModelRef: ImageModelPins.resolve(data),
    });
  }

  _sessionFor(conversationId, data) {
    const gameDir = this._folders.gameDirFor(conversationId);
    if (this._context.code) {
      return GameSessions.ensure({ context: this._context, conversationId, sessions: this._sessions, gameDir, name: data.name, kind: data.kind });
    }
    return this._sessions.get(conversationId) || { dir: gameDir, assets: new Map(), files: new Map() };
  }
}

module.exports = GameAiSurface;
