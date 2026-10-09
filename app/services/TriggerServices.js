const TriggerStore = require('../../core/llm-server/chat/TriggerStore');
const TriggerRunner = require('../../core/llm-server/chat/TriggerRunner');
const TriggerMode = require('../../core/llm-server/chat/TriggerMode');
const TriggerSecrets = require('../../core/llm-server/chat/triggers/TriggerSecrets');
const PageChangeSource = require('../../core/llm-server/chat/triggers/PageChangeSource');
const FileWatchSource = require('../../core/llm-server/chat/triggers/FileWatchSource');
const NotificationSource = require('../../core/llm-server/chat/triggers/NotificationSource');
const WebhookSource = require('../../core/llm-server/chat/triggers/WebhookSource');
const AppPaths = require('../../core/shared/AppPaths');
const TriggerEvents = require('../events/TriggerEvents');
const TriggerNotifier = require('../events/TriggerNotifier');
const HookBaseUrls = require('../sharing/HookBaseUrls');
const ChatTaskServices = require('./ChatTaskServices');

class TriggerServices {
  static PAGE_DETECTOR_ID = 'page-change-detector';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._s.triggerStore = new TriggerStore({ settingsDb: this._db });
    this._buildEvents();
    this._s.triggerSecrets = new TriggerSecrets(this._db);
    this._buildRunner();
    this._buildSources();
    this._registerMode();
    this._mountHooks();
    return this._s;
  }

  _buildEvents() {
    const events = new TriggerEvents({
      renderers: this._ctx.renderers,
      getFileWatch: () => this._s.fileWatchManager || null,
      getSources: () => [this._s.pageChangeSource, this._s.notificationSource],
    });
    this._s.triggerEvents = events;
    this._s.emitTriggersEvent = events.emitter();
  }

  _buildRunner() {
    this._s.triggerRunner = new TriggerRunner({
      triggerStore: this._s.triggerStore,
      settingsDb: this._db,
      getAgentDeps: () => this._ctx.agentDeps,
      getRouter: () => global.__lumaChatRouter,
      emitEvent: this._s.emitTriggersEvent,
      gate: this._s.backgroundRunGate,
      notify: this._buildNotifier().notifier(),
      getAgentManager: () => global.__lumaAgentManager || null,
    });
  }

  _buildNotifier() {
    return new TriggerNotifier({
      db: this._db,
      notice: this._ctx.desktopNotice,
      showWindow: () => TriggerServices._raise(this._ctx.liveWindow()),
      openLlmTab: () => this._s.llmServerService.ensurePinnedTab({ activate: true }),
      emitOpen: (triggerId) => this._s.emitTriggersEvent('open', { triggerId }),
    });
  }

  _buildSources() {
    const base = { triggerStore: this._s.triggerStore, runner: this._s.triggerRunner };
    this._s.pageChangeSource = new PageChangeSource({ ...base, getDetectorApi: () => this._detectorApi() });
    this._s.triggerRunner.pageSource = this._s.pageChangeSource;
    this._s.hookBaseUrls = new HookBaseUrls({
      getPort: () => this._s.restGateway.port,
      getHostService: () => this._s.sharingHostService || null,
      getWebServer: () => this._s.sharingWebServer || null,
    });
    this._s.getHookBaseUrls = this._s.hookBaseUrls.getter();
    this._s.fileWatchManager = new FileWatchSource({ ...base, settingsDb: this._db, emitEvent: this._s.emitTriggersEvent, forbiddenRoots: this._forbiddenRoots() });
    this._s.notificationSource = new NotificationSource({ ...base, settingsDb: this._db, getTabViewManager: () => this._ctx.tabViewManager || null });
  }

  _registerMode() {
    new TriggerMode({
      triggerStore: this._s.triggerStore,
      getRunner: () => this._s.triggerRunner,
      getFileWatch: () => this._s.fileWatchManager,
      getPageSource: () => this._s.pageChangeSource,
      getSecrets: () => this._s.triggerSecrets,
      getArtifactStore: () => (this._ctx.agentDeps && this._ctx.agentDeps.artifactStore) || null,
      getChatStore: ChatTaskServices.chatStore,
      getHookBaseUrls: this._s.getHookBaseUrls,
      getAgentManager: () => global.__lumaAgentManager || null,
      getNotificationSource: () => this._s.notificationSource,
      emitEvent: this._s.emitTriggersEvent,
    }).register();
  }

  _mountHooks() {
    this._s.hooksRouter = new WebhookSource({
      triggerStore: this._s.triggerStore,
      runner: this._s.triggerRunner,
      emitEvent: this._s.emitTriggersEvent,
      secrets: this._s.triggerSecrets,
    }).router();
    this._s.restGateway.getApp().use('/hooks', this._s.hooksRouter);
  }

  _detectorApi() {
    try {
      return this._s.extensionManager ? this._s.extensionManager.getApi(TriggerServices.PAGE_DETECTOR_ID) : null;
    } catch (_) {
      return null;
    }
  }

  _forbiddenRoots() {
    let base = null;
    try { base = AppPaths.appBaseDir(); } catch (_) {}
    return [this._ctx.app.getAppPath(), this._ctx.dataDir, base];
  }

  static _raise(win) {
    if (!win) return;
    win.show();
    win.focus();
  }
}

module.exports = TriggerServices;
