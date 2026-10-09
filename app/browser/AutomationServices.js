const LlmFallbackService = require('../../core/browser/LlmFallbackService');
const ResolutionCache = require('../../core/browser/ResolutionCache');
const BrowserController = require('../../core/browser/BrowserController');
const BrowserRoutes = require('../../core/browser/BrowserRoutes');
const BrowserService = require('../../core/browser/BrowserService');
const VisualGroundingService = require('../../core/browser/vision/VisualGroundingService');
const DesktopService = require('../../core/desktop/DesktopService');
const DesktopIpcHandlers = require('../../core/desktop/DesktopIpcHandlers');
const AppGlobals = require('../AppGlobals');

class AutomationServices {
  static FORWARDED_TAB_EVENTS = [['viewAttached', 'webviewAttached'], ['tabCreated', 'tabCreated'], ['tabClosed', 'tabClosed'], ['tabNavigated', 'tabNavigated']];

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  build(win) {
    const llmFallbackService = this._buildSelectorFallback();
    this._mountRestRoutes(llmFallbackService);
    const browserService = new BrowserService(this._ctx.tabManager, win, this._s.networkInterceptor);
    const desktopService = this._buildVisionAndDesktop(browserService, llmFallbackService.resolutionCache);
    this._forwardTabEvents(browserService);
    this._ctx.browserService = browserService;
    return { browserService, llmFallbackService, desktopService };
  }

  _buildSelectorFallback() {
    const fallback = new LlmFallbackService(this._s.llmService, this._ctx.tabManager);
    fallback.resolutionCache = AppGlobals.publish('__lumaResolutionCache', new ResolutionCache({ store: this._s.db }));
    return fallback;
  }

  _mountRestRoutes(llmFallbackService) {
    const gateway = this._s.restGateway;
    const browserController = new BrowserController(this._ctx.tabManager, this._s.networkInterceptor, llmFallbackService);
    gateway.mountCore('/api/browser', BrowserRoutes.create(browserController));
    gateway.mountHealthEndpoints();
  }

  _buildVisionAndDesktop(browserService, resolutionCache) {
    const { nativeImage, clipboard } = this._ctx.electron;
    const db = this._s.db;
    const visualGrounding = new VisualGroundingService({ llmService: this._s.llmService, tabManager: this._ctx.tabManager, db, nativeImage, resolutionCache });
    browserService.setVisualGrounding(visualGrounding);
    AppGlobals.publish('__lumaVisualGrounding', visualGrounding);
    const desktopService = AppGlobals.publish('__lumaDesktop', new DesktopService({ db, nativeImage, visualGrounding, clipboard }));
    new DesktopIpcHandlers(desktopService).register();
    return desktopService;
  }

  _forwardTabEvents(browserService) {
    const tvm = this._ctx.tabViewManager;
    for (const [from, to] of AutomationServices.FORWARDED_TAB_EVENTS) {
      tvm.on(from, (...args) => browserService.emit(to, ...args));
    }
  }
}

module.exports = AutomationServices;
