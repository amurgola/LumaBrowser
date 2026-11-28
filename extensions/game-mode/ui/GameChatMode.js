import GameKickoff from './GameKickoff.js';
import GameLanguageModel from './GameLanguageModel.js';
import GamePlayOverlay from './GamePlayOverlay.js';
import GameServerApi from './GameServerApi.js';
import GameSetupSchema from './GameSetupSchema.js';
import GameStrip from './GameStrip.js';
import GameStripActions from './GameStripActions.js';
import GameStripMarkup from './GameStripMarkup.js';

export default class GameChatMode {
  static MODE_ID = 'game';

  static STATE_EVENT = 'game:state';

  static JOB_FINISHED = 'finished';

  static STYLESHEET_ID = 'gm-styles';

  static STYLESHEET_URL = '/llm-ui/ext/game-mode/game.css';

  constructor() {
    this._registry = null;
    this._convId = null;
    this._latest = null;
    this._localModels = [];
    this._watchingJobs = false;
    this._strip = new GameStrip(this._stripHandlers());
    this._actions = new GameStripActions(this._strip, () => this._convId);
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
      startConversation: (api, ctx, data) => this._startConversation(api, ctx, data),
      decorateComposer: (els, ctx) => this._decorateComposer(els, ctx),
      onOpenConversation: (meta, ctx) => this._onOpenConversation(meta, ctx),
      applyTheme: (rootEl, meta, ctx) => this._apply(meta, ctx),
      onLeaveConversation: () => this._onLeaveConversation(),
      onChatEvent: (evt, ctx) => this._onChatEvent(evt, ctx),
      onModelPicked: (ref, ctx) => GameLanguageModel.record(ref, ctx),
    };
  }

  showPlay() {
    if (!this._convId) return;
    this._overlay.show(this._latest && this._latest.name, GameStripMarkup.isAiGame(this._latest));
  }

  popOut() {
    if (!this._convId) return;
    const url = GameServerApi.playUrl(this._convId, false);
    GameServerApi.openTab(this._convId).catch(() => { try { window.open(url); } catch (_) {} });
  }

  _stripHandlers() {
    return {
      play: () => this.showPlay(),
      popout: () => this.popOut(),
      export: () => this._actions.exportZip(),
      share: () => this._actions.publishShare(),
      newgame: () => this._actions.resetStores(),
    };
  }

  async _openSetup(api, ctx) {
    const [imageModels, llm] = await Promise.all([GameSetupSchema.fetchImageModels(api), GameLanguageModel.choices(api)]);
    this._localModels = llm.locals;
    const schema = GameSetupSchema.build(imageModels, llm.options);
    const initial = GameSetupSchema.defaultPins(imageModels);
    const host = ctx && ctx.setupHost && ctx.setupHost();
    return host
      ? this._registry.openSchemaInline(schema, { api, host, initial })
      : this._registry.openSchemaModal(schema, { api, initial });
  }

  async _startConversation(api, ctx, data) {
    this._adoptConversation(ctx);
    await GameLanguageModel.apply(api, data && data.llmModel, this._localModels);
    const msg = GameKickoff.message(data);
    try { if (ctx && typeof ctx.sendTurn === 'function') ctx.sendTurn(msg); } catch (_) {}
  }

  _decorateComposer(els, ctx) {
    this._adoptConversation(ctx);
    if (els && els.bar) this._strip.attach(els.bar);
  }

  _onOpenConversation(meta, ctx) {
    this._latest = GameChatMode._gameOf(meta);
    this._apply(meta, ctx);
    this._refreshState();
  }

  _onLeaveConversation() {
    this._convId = null;
    this._latest = null;
    this._overlay.hide();
    this._strip.reset();
  }

  _onChatEvent(evt, ctx) {
    if (!evt) return;
    this._adoptConversation(ctx);
    if (evt.type !== GameChatMode.STATE_EVENT) {
      if (!this._strip.mounted) this._strip.paint();
      return;
    }
    this._latest = evt.payload || null;
    this._render();
  }

  _apply(meta, ctx) {
    this._adoptConversation(ctx);
    this._latest = GameChatMode._gameOf(meta) || this._latest;
    this._render();
  }

  _render() {
    this._strip.show(this._latest);
  }

  _adoptConversation(ctx) {
    if (!ctx) return;
    if (ctx.conversationId) this._convId = ctx.conversationId;
    this._watchJobs(ctx.api);
  }

  _watchJobs(api) {
    if (this._watchingJobs || !api || typeof api.onConvJobsEvent !== 'function') return;
    this._watchingJobs = true;
    api.onConvJobsEvent((ev) => this._onJobEvent(ev));
  }

  _onJobEvent(ev) {
    const payload = (ev && ev.payload) || {};
    if (!ev || ev.type !== GameChatMode.JOB_FINISHED || !this._convId || payload.conversationId !== this._convId) return;
    this._refreshState();
  }

  async _refreshState() {
    const convId = this._convId;
    if (!convId) return;
    let game = null;
    try { game = await GameServerApi.state(convId); } catch (_) { return; }
    if (!game || this._convId !== convId) return;
    this._latest = game;
    this._render();
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
