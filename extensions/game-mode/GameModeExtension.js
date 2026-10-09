const GameFolders = require('./GameFolders');
const GameKnowledgeBase = require('./GameKnowledgeBase');
const GameAiSurface = require('./mode/GameAiSurface');
const GameModeDescriptor = require('./mode/GameModeDescriptor');

class GameModeExtension {
  static activate(context) {
    return new GameModeExtension(context).execute();
  }

  constructor(context, { folders = new GameFolders() } = {}) {
    this._context = context;
    this._folders = folders;
    this._sessions = new Map();
    this._gatewayInfo = { baseUrl: null };
  }

  execute() {
    GameKnowledgeBase.seed();
    const aiSurface = new GameAiSurface({ context: this._context, sessions: this._sessions, folders: this._folders });
    const descriptor = new GameModeDescriptor({
      context: this._context,
      sessions: this._sessions,
      folders: this._folders,
      gatewayInfo: this._gatewayInfo,
      aiSurface,
    });
    this._context.chat.registerMode(descriptor.build());
    return this._api(aiSurface);
  }

  _api(aiSurface) {
    return {
      gamesRoot: this._folders.gamesRoot,
      gameDirFor: (conversationId) => this._folders.gameDirFor(conversationId),
      sanitizeConvId: (conversationId) => GameFolders.sanitizeConvId(conversationId),
      ai: aiSurface,
      gatewayInfo: this._gatewayInfo,
    };
  }
}

module.exports = GameModeExtension;
