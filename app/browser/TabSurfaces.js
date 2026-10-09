const TabViewManager = require('../../core/browser/TabViewManager');
const TabManager = require('../../core/browser/TabManager');
const ChromeOverlay = require('../../core/browser/ChromeOverlay');
const TabPreviewManager = require('../../core/browser/TabPreviewManager');
const OnDemandOverlay = require('../../core/on-demand/OnDemandOverlay');
const ChatModeRegistry = require('../../core/llm-server/chat/ChatModeRegistry');
const AppGlobals = require('../AppGlobals');
const VoiceReadiness = require('./VoiceReadiness');

class TabSurfaces {
  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._log = log;
  }

  build(win) {
    this._buildTabs(win);
    this._relayFavicons(win);
    this._buildOverlays(win);
    this._buildOnDemand(win);
    this._s.llmServerService.attach(this._ctx.tabViewManager);
    this._s.dashboardService.attachTabViewManager(this._ctx.tabViewManager);
    return this._ctx.tabViewManager;
  }

  _buildTabs(win) {
    const s = this._s;
    this._ctx.tabViewManager = new TabViewManager(win, {
      preloadPath: this._ctx.path('webview-preload.js'),
      networkInterceptor: s.networkInterceptor,
      chromeExtensionService: s.chromeExtensionService,
      adblockerService: s.adblockerService,
      db: s.db,
      faviconCache: s.faviconCache,
    });
    this._ctx.tabManager = new TabManager(this._ctx.tabViewManager);
  }

  _relayFavicons(win) {
    this._s.faviconCache.on('favicon', (payload) => {
      if (!win.isDestroyed()) win.webContents.send('tab-view:favicon', payload);
    });
  }

  _buildOverlays(win) {
    const tvm = this._ctx.tabViewManager;
    const overlay = new ChromeOverlay(win);
    tvm.on('tabSwitched', () => overlay.raiseVisible());
    const preview = new TabPreviewManager(win, tvm, { db: this._s.db });
    preview.on('raised', () => overlay.raiseVisible());
    this._ctx.chromeOverlay = overlay;
    this._ctx.tabPreviewManager = AppGlobals.publish('__lumaTabPreview', preview);
  }

  _buildOnDemand(win) {
    const voice = new VoiceReadiness({ stt: this._s.whisperServerService, tts: this._s.ttsServerService });
    voice.refreshStt();
    const onDemand = new OnDemandOverlay(win, this._ctx.tabViewManager, {
      db: this._s.db,
      getRouter: () => global.__lumaChatRouter || null,
      chatModeRegistry: ChatModeRegistry.shared,
      tabPreviewManager: this._ctx.tabPreviewManager,
      sttReady: () => voice.sttReady(),
      ttsReady: () => voice.ttsReady(),
      log: (m) => this._log.log('[on-demand]', m),
    });
    this._ctx.onDemandOverlay = AppGlobals.publish('__lumaOnDemand', onDemand);
  }
}

module.exports = TabSurfaces;
