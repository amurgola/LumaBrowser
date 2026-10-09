import GameKickoff from './GameKickoff.js';
import GamePanelActions from './GamePanelActions.js';
import GamePanelMarkup from './GamePanelMarkup.js';
import GamePlayOverlay from './GamePlayOverlay.js';
import GameServerApi from './GameServerApi.js';
import GameSetupSchema from './GameSetupSchema.js';
import GameStatusPanel from './GameStatusPanel.js';

export default class GameChatMode {
  static MODE_ID = 'game';

  static STYLESHEET_ID = 'gm-styles';

  static STYLESHEET_URL = '/llm-ui/ext/game-mode/game.css';

  constructor() {
    this._registry = null;
    this._convId = null;
    this._latest = null;
    this._collapsed = false;
    this._panel = new GameStatusPanel(this._panelHandlers());
    this._actions = new GamePanelActions(this._panel, () => this._convId);
    this._overlay = new GamePlayOverlay({
      playUrl: (bust) => GameServerApi.playUrl(this._convId, bust),
      onPopOut: () => this.popOut(),
    });
  }

  register(registry, win) {
    this._registry = registry;
    GameChatMode._linkStylesheet();
    this._overlay.listen(win);
    registry.registerMode(this.hooks());
  }

  hooks() {
    return {
      id: GameChatMode.MODE_ID,
      openSetup: (api, ctx) => this._openSetup(api, ctx),
      startConversation: (api, ctx, data) => this._startConversation(ctx, data),
      onOpenConversation: (meta, ctx) => {
        this._latest = GameChatMode._gameOf(meta);
        this._apply(meta, ctx);
      },
      applyTheme: (rootEl, meta, ctx) => this._apply(meta, ctx),
      onLeaveConversation: () => {
        this._overlay.hide();
        this._panel.clear();
      },
      onChatEvent: (evt, ctx) => this._onChatEvent(evt, ctx),
    };
  }

  showPlay() {
    if (!this._convId) return;
    this._overlay.show(this._latest && this._latest.name, GamePanelMarkup.isAiGame(this._latest));
  }

  popOut() {
    if (!this._convId) return;
    const url = GameServerApi.playUrl(this._convId, false);
    GameServerApi.openTab(this._convId).catch(() => { try { window.open(url); } catch (_) {} });
  }

  _panelHandlers() {
    return {
      play: () => this.showPlay(),
      popout: () => this.popOut(),
      export: () => this._actions.exportZip(),
      share: () => this._actions.publishShare(),
      newgame: () => this._actions.resetStores(),
      collapse: () => {
        this._collapsed = !this._collapsed;
        this._render();
      },
    };
  }

  async _openSetup(api, ctx) {
    const models = await GameSetupSchema.fetchImageModels(api);
    const schema = GameSetupSchema.build(models);
    const initial = GameSetupSchema.defaultPins(models);
    const host = ctx && ctx.setupHost && ctx.setupHost();
    return host
      ? this._registry.openSchemaInline(schema, { api, host, initial })
      : this._registry.openSchemaModal(schema, { api, initial });
  }

  _startConversation(ctx, data) {
    this._adoptConversation(ctx);
    const msg = GameKickoff.message(data);
    try { if (ctx && typeof ctx.sendTurn === 'function') ctx.sendTurn(msg); } catch (_) {}
  }

  _onChatEvent(evt, ctx) {
    if (!evt || evt.type !== 'game:state') return;
    this._adoptConversation(ctx);
    this._latest = evt.payload || null;
    this._render();
  }

  _apply(meta, ctx) {
    this._adoptConversation(ctx);
    this._latest = GameChatMode._gameOf(meta) || this._latest;
    this._render();
  }

  _render() {
    this._panel.ensure();
    this._panel.render(this._latest, this._collapsed);
  }

  _adoptConversation(ctx) {
    if (ctx && ctx.conversationId) this._convId = ctx.conversationId;
  }

  static _gameOf(meta) {
    return (meta && meta.data && meta.data.game) || null;
  }

  static _linkStylesheet() {
    if (document.getElementById(GameChatMode.STYLESHEET_ID)) return;
    const link = document.createElement('link');
    link.id = GameChatMode.STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = GameChatMode.STYLESHEET_URL;
    document.head.appendChild(link);
  }
}
