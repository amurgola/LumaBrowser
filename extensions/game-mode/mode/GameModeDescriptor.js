const fs = require('fs');
const PendingAssetDrainer = require('../assets/PendingAssetDrainer');
const GameSnapshot = require('../session/GameSnapshot');
const GameDataStores = require('../store/GameDataStores');
const GameSetupSchema = require('./GameSetupSchema');
const GameTurnBuilder = require('./GameTurnBuilder');

class GameModeDescriptor {
  static DESCRIPTION = 'Describe a game and an agent builds it as a playable Phaser 3 project: exportable, '
    + 'or AI-driven with live characters and generated content. Then press Play.';

  constructor(ext) {
    this._context = ext.context;
    this._sessions = ext.sessions;
    this._folders = ext.folders;
    this._turns = new GameTurnBuilder(ext);
  }

  build() {
    return {
      id: 'game',
      label: 'Game',
      icon: '🎮',
      description: GameModeDescriptor.DESCRIPTION,
      requirements: ['llm'],
      chatUiUrl: this._context.chat.uiUrl('chat-ui.js'),
      setupSchema: GameSetupSchema.build(),
      workspaceRoot: (args) => this.workspaceRoot(args),
      buildTurn: (args) => this._turns.build(args),
      postProcess: (args) => this.postProcess(args),
      onConversationDeleted: (args) => this.onConversationDeleted(args),
    };
  }

  workspaceRoot({ conversationId, meta }) {
    const name = meta && meta.data && meta.data.name;
    return { root: this._folders.gameDirFor(conversationId), label: name ? String(name) : 'Game' };
  }

  async postProcess({ conversationId, meta, emit, setMeta, aborted }) {
    const s = this._sessions.get(conversationId);
    if (!s || !s.workspaceId) return;
    await this._settleAssets(s, emit, aborted);
    let game = null;
    try { game = GameSnapshot.of(s); } catch (_) { return; }
    try { setMeta({ data: { ...((meta && meta.data) || {}), game } }); } catch (_) {}
    try { emit(GameSnapshot.EVENT, game); } catch (_) {}
  }

  onConversationDeleted({ conversationId }) {
    this._sessions.delete(conversationId);
    let dir = null;
    try { dir = this._folders.gameDirFor(conversationId); } catch (_) { return; }
    GameDataStores.drop(dir);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }

  async _settleAssets(s, emit, aborted) {
    if (aborted) {
      s.pendingAssets = [];
      return;
    }
    try {
      await PendingAssetDrainer.drain({ context: this._context, s, emit: (evt) => emit(evt.type, evt.payload) });
    } catch (_) {}
  }
}

module.exports = GameModeDescriptor;
