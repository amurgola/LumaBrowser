import AdvancedView from './advanced/AdvancedView.js';
import DefaultsCard from './defaults/DefaultsCard.js';
import DiagnosticsLoader from './diagnostics/DiagnosticsLoader.js';
import HostFixActions from './diagnostics/HostFixActions.js';
import SetupExtensionTabs from './extensions/SetupExtensionTabs.js';
import FitTestController from './fit-test/FitTestController.js';
import GambitController from './gambit/GambitController.js';
import ModelRename from './models/ModelRename.js';
import ModelsCard from './models/ModelsCard.js';
import SetupNavigator from './nav/SetupNavigator.js';
import PlanExplainer from './plan/PlanExplainer.js';
import RuntimeActions from './runtimes/RuntimeActions.js';
import RuntimeRowProgress from './runtimes/RuntimeRowProgress.js';
import RuntimesCard from './runtimes/RuntimesCard.js';
import LibraryRefresher from './LibraryRefresher.js';
import SetupClickRouter from './SetupClickRouter.js';
import SetupContext from './SetupContext.js';

export default class SetupMain {
  constructor({ api, doc = document, win = window, modelList = null, modelSearch = null, openers = {} }) {
    this.ctx = new SetupContext({ api, doc, win });
    this._modelList = modelList;
    this._modelSearch = modelSearch;
    this._openers = openers;
    this._buildCards();
    this._buildSurfaces();
  }

  start() {
    this.navigator.start();
    this.advanced.init();
    this.extensionTabs.start();
    this._clickRouter.start();
    this._bindLiveEvents();
    this.ctx.cards.fitTest.bindEvents();
    this.ctx.cards.gambit.bindEvents();
    const reload = this.ctx.doc.getElementById('reloadBtn');
    if (reload) reload.addEventListener('click', () => this.load({ force: true }));
    return this.load();
  }

  load(opts) {
    return this._loader.load(opts);
  }

  _buildCards() {
    const ctx = this.ctx;
    const cards = ctx.cards;
    cards.runtimes = new RuntimesCard(ctx);
    cards.runtimeActions = new RuntimeActions(ctx);
    cards.fitTest = new FitTestController(ctx);
    cards.gambit = new GambitController(ctx, cards.fitTest.state);
    cards.models = new ModelsCard(ctx, this._modelList);
    cards.defaults = new DefaultsCard(ctx);
    cards.plan = new PlanExplainer(ctx);
    this._library = new LibraryRefresher(ctx);
    ctx.refreshLibrary = (opts) => this._library.request(opts);
    this._loader = new DiagnosticsLoader(ctx);
  }

  _buildSurfaces() {
    const ctx = this.ctx;
    this.advanced = new AdvancedView({ api: ctx.api, doc: ctx.doc });
    this.extensionTabs = new SetupExtensionTabs({ api: ctx.api, doc: ctx.doc, win: ctx.win });
    this.navigator = new SetupNavigator({
      doc: ctx.doc,
      openers: { ...this._openers, advanced: () => this.advanced.open() },
      extensionTabs: this.extensionTabs,
    });
    this.extensionTabs.attachNavigator(this.navigator);
    this._clickRouter = new SetupClickRouter(ctx, {
      rows: ctx.cards.defaults.rows,
      hostFixes: new HostFixActions({ api: ctx.api, reload: () => this.load() }),
      rename: new ModelRename(ctx),
      runtimeActions: ctx.cards.runtimeActions,
      modelSearch: this._modelSearch,
    });
  }

  _bindLiveEvents() {
    const api = this.ctx.api;
    this.ctx.win.addEventListener('luma-models-changed', () => this._library.request());
    this.ctx.cards.plan.bindEvents();
    this.ctx.cards.models.addons.bindEvents();
    if (!api) return;
    if (api.onRuntimeEvent) {
      const progress = new RuntimeRowProgress(this.ctx.doc);
      api.onRuntimeEvent((evt) => {
        if (evt) progress.applyEvent(evt);
        if (evt && evt.type === 'finalize') this._library.request({ runtimes: true });
      });
    }
    if (api.onModelEvent) {
      api.onModelEvent((evt) => { if (evt && evt.type === 'done') this._library.request(); });
    }
  }
}
