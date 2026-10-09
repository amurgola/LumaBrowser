const GameKind = require('../session/GameKind');
const GameSessions = require('../session/GameSessions');

class GameToolScope {
  constructor({ context, conversationId, sessions, gameDir, name, kind }) {
    this.context = context;
    this.conversationId = conversationId;
    this.sessions = sessions;
    this.gameDir = gameDir;
    this.name = name;
    this.kind = GameKind.normalize(kind);
  }

  get code() {
    return this.context && this.context.code;
  }

  get chat() {
    return this.context && this.context.chat;
  }

  session() {
    return GameSessions.ensure({
      context: this.context,
      conversationId: this.conversationId,
      sessions: this.sessions,
      gameDir: this.gameDir,
      name: this.name,
      kind: this.kind,
    });
  }

  existingSession() {
    return this.sessions.get(this.conversationId);
  }
}

module.exports = GameToolScope;
