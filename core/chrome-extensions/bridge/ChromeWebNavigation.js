const { webContents: webContentsModule, webFrameMain: webFrameMainModule } = require('electron');

class ChromeWebNavigation {
  static BOUND_FLAG = '_lumaWebNavigationBound';
  static MAIN_FRAME = 0;
  static NO_PARENT = -1;

  constructor({ broadcast, webContents = webContentsModule, webFrameMain = webFrameMainModule } = {}) {
    this._broadcast = broadcast;
    this._webContents = webContents;
    this._webFrameMain = webFrameMain;
    this._getTabViewManager = () => null;
  }

  install(app, getTabViewManager) {
    this._getTabViewManager = getTabViewManager || (() => null);
    app.on('web-contents-created', (_event, wc) => this.attach(wc));
  }

  attach(wc) {
    if (!wc || wc[ChromeWebNavigation.BOUND_FLAG]) return;
    wc[ChromeWebNavigation.BOUND_FLAG] = true;
    const frameOf = (isMainFrame, processId, routingId) => ChromeWebNavigation.frameIds(isMainFrame, this._frame(processId, routingId));
    wc.on('did-start-navigation', (event, url, isInPlace, isMainFrame, processId, routingId) => {
      const d = ChromeWebNavigation._details(event, { url, isMainFrame, isSameDocument: isInPlace });
      const frame = (event && event.frame) || this._frame(processId, routingId);
      if (!d.isSameDocument) this._emit(wc, 'onBeforeNavigate', { url: d.url, ...ChromeWebNavigation.frameIds(d.isMainFrame, frame) });
    });
    wc.on('did-frame-navigate', (_event, url, _code, _status, isMainFrame, processId, routingId) => {
      this._emit(wc, 'onCommitted', { url, ...frameOf(isMainFrame, processId, routingId), transitionType: 'link', transitionQualifiers: [] });
    });
    wc.on('did-navigate-in-page', (_event, url, isMainFrame, processId, routingId) => {
      const name = ChromeWebNavigation.isFragmentChange(wc, url) ? 'onReferenceFragmentUpdated' : 'onHistoryStateUpdated';
      this._emit(wc, name, { url, ...frameOf(isMainFrame, processId, routingId), transitionType: 'link', transitionQualifiers: [] });
    });
    wc.on('dom-ready', () => this._emit(wc, 'onDOMContentLoaded', { url: ChromeWebNavigation._url(wc), ...ChromeWebNavigation.frameIds(true) }));
    wc.on('did-frame-finish-load', (_event, isMainFrame, processId, routingId) => {
      const frame = this._frame(processId, routingId);
      this._emit(wc, 'onCompleted', { url: isMainFrame ? ChromeWebNavigation._url(wc) : ((frame && frame.url) || ''), ...ChromeWebNavigation.frameIds(isMainFrame, frame) });
    });
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame, processId, routingId) => {
      this._emit(wc, 'onErrorOccurred', { url: validatedURL, ...frameOf(isMainFrame, processId, routingId), error: errorDescription || `net error ${errorCode}` });
    });
  }

  getFrame(details) {
    const frames = this.getAllFrames(details);
    if (!frames) return null;
    const frameId = details && Number.isInteger(details.frameId) ? details.frameId : ChromeWebNavigation.MAIN_FRAME;
    return frames.find((f) => f.frameId === frameId) || null;
  }

  getAllFrames(details) {
    const wc = this._tabById(details && details.tabId);
    if (!wc) return null;
    const main = wc.mainFrame;
    if (!main) return [ChromeWebNavigation._frameInfo(ChromeWebNavigation.MAIN_FRAME, ChromeWebNavigation.NO_PARENT, ChromeWebNavigation._url(wc))];
    const frames = [];
    const walk = (frame, frameId, parentFrameId) => {
      frames.push(ChromeWebNavigation._frameInfo(frameId, parentFrameId, frame.url));
      for (const child of frame.frames || []) walk(child, child.frameTreeNodeId, frameId);
    };
    walk(main, ChromeWebNavigation.MAIN_FRAME, ChromeWebNavigation.NO_PARENT);
    return frames;
  }

  static frameIds(isMainFrame, frame = null) {
    if (isMainFrame) return { frameId: ChromeWebNavigation.MAIN_FRAME, parentFrameId: ChromeWebNavigation.NO_PARENT };
    if (!frame || !Number.isInteger(frame.frameTreeNodeId)) return { frameId: null, parentFrameId: null };
    const parent = frame.parent;
    const parentIsMain = !parent || !parent.parent;
    return { frameId: frame.frameTreeNodeId, parentFrameId: parentIsMain ? ChromeWebNavigation.MAIN_FRAME : parent.frameTreeNodeId };
  }

  static isFragmentChange(wc, url) {
    try {
      const next = new URL(url);
      const current = new URL(ChromeWebNavigation._url(wc));
      return next.hash !== current.hash && next.origin === current.origin && next.pathname === current.pathname && next.search === current.search;
    } catch (_) {
      return false;
    }
  }

  _emit(wc, name, fields) {
    if (fields.frameId === null || !this._isTab(wc)) return;
    this._broadcast(wc.session, name, { tabId: wc.id, timeStamp: Date.now(), processId: -1, ...fields });
  }

  _isTab(wc) {
    try {
      const tvm = this._getTabViewManager();
      const id = tvm && typeof tvm.findTabIdByWebContents === 'function' ? tvm.findTabIdByWebContents(wc) : null;
      return id !== null && id !== undefined;
    } catch (_) {
      return false;
    }
  }

  _tabById(tabId) {
    if (!Number.isInteger(tabId)) return null;
    try {
      const wc = this._webContents.fromId(tabId);
      return wc && !wc.isDestroyed() && this._isTab(wc) ? wc : null;
    } catch (_) {
      return null;
    }
  }

  _frame(processId, routingId) {
    try { return this._webFrameMain.fromId(processId, routingId) || null; } catch (_) { return null; }
  }

  static _details(event, fallback) {
    const e = event || {};
    return {
      url: typeof e.url === 'string' ? e.url : fallback.url,
      isMainFrame: typeof e.isMainFrame === 'boolean' ? e.isMainFrame : !!fallback.isMainFrame,
      isSameDocument: typeof e.isSameDocument === 'boolean' ? e.isSameDocument : !!fallback.isSameDocument,
    };
  }

  static _frameInfo(frameId, parentFrameId, url) {
    return { frameId, parentFrameId, url: url || '', errorOccurred: false, documentLifecycle: 'active', frameType: frameId === 0 ? 'outermost_frame' : 'sub_frame' };
  }

  static _url(wc) {
    try { return wc.getURL(); } catch (_) { return ''; }
  }
}

module.exports = ChromeWebNavigation;
