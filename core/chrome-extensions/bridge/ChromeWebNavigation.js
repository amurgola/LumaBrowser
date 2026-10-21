const { webContents: webContentsModule } = require('electron');

class ChromeWebNavigation {
  static BOUND_FLAG = '_lumaWebNavigationBound';
  static MAIN_FRAME = 0;
  static NO_PARENT = -1;

  constructor({ broadcast, webContents = webContentsModule } = {}) {
    this._broadcast = broadcast;
    this._webContents = webContents;
    this._getTabViewManager = () => null;
  }

  install(app, getTabViewManager) {
    this._getTabViewManager = getTabViewManager || (() => null);
    app.on('web-contents-created', (_event, wc) => this.attach(wc));
  }

  attach(wc) {
    if (!wc || wc[ChromeWebNavigation.BOUND_FLAG]) return;
    wc[ChromeWebNavigation.BOUND_FLAG] = true;
    const frameOf = (isMainFrame, routingId) => ChromeWebNavigation.frameIds(isMainFrame, routingId);
    wc.on('did-start-navigation', (event, url, isInPlace, isMainFrame, _pid, routingId) => {
      const d = ChromeWebNavigation._details(event, { url, isMainFrame, isSameDocument: isInPlace, routingId });
      if (!d.isSameDocument) this._emit(wc, 'onBeforeNavigate', { url: d.url, ...frameOf(d.isMainFrame, d.routingId) });
    });
    wc.on('did-frame-navigate', (_event, url, _code, _status, isMainFrame, _pid, routingId) => {
      this._emit(wc, 'onCommitted', { url, ...frameOf(isMainFrame, routingId), transitionType: 'link', transitionQualifiers: [] });
    });
    wc.on('did-navigate-in-page', (_event, url, isMainFrame, _pid, routingId) => {
      const name = ChromeWebNavigation.isFragmentChange(wc, url) ? 'onReferenceFragmentUpdated' : 'onHistoryStateUpdated';
      this._emit(wc, name, { url, ...frameOf(isMainFrame, routingId), transitionType: 'link', transitionQualifiers: [] });
    });
    wc.on('dom-ready', () => this._emit(wc, 'onDOMContentLoaded', { url: ChromeWebNavigation._url(wc), ...frameOf(true, 0) }));
    wc.on('did-frame-finish-load', (_event, isMainFrame, _pid, routingId) => {
      this._emit(wc, 'onCompleted', { url: ChromeWebNavigation._frameUrl(wc, isMainFrame, routingId), ...frameOf(isMainFrame, routingId) });
    });
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame, _pid, routingId) => {
      this._emit(wc, 'onErrorOccurred', { url: validatedURL, ...frameOf(isMainFrame, routingId), error: errorDescription || `net error ${errorCode}` });
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
      for (const child of frame.frames || []) walk(child, child.routingId, frameId);
    };
    walk(main, ChromeWebNavigation.MAIN_FRAME, ChromeWebNavigation.NO_PARENT);
    return frames;
  }

  static frameIds(isMainFrame, routingId) {
    return isMainFrame
      ? { frameId: ChromeWebNavigation.MAIN_FRAME, parentFrameId: ChromeWebNavigation.NO_PARENT }
      : { frameId: routingId || 0, parentFrameId: ChromeWebNavigation.MAIN_FRAME };
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
    if (!this._isTab(wc)) return;
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

  static _details(event, fallback) {
    const e = event || {};
    return {
      url: typeof e.url === 'string' ? e.url : fallback.url,
      isMainFrame: typeof e.isMainFrame === 'boolean' ? e.isMainFrame : !!fallback.isMainFrame,
      isSameDocument: typeof e.isSameDocument === 'boolean' ? e.isSameDocument : !!fallback.isSameDocument,
      routingId: e.frame && Number.isInteger(e.frame.routingId) ? e.frame.routingId : fallback.routingId,
    };
  }

  static _frameInfo(frameId, parentFrameId, url) {
    return { frameId, parentFrameId, url: url || '', errorOccurred: false, documentLifecycle: 'active', frameType: frameId === 0 ? 'outermost_frame' : 'sub_frame' };
  }

  static _url(wc) {
    try { return wc.getURL(); } catch (_) { return ''; }
  }

  static _frameUrl(wc, isMainFrame, routingId) {
    if (isMainFrame) return ChromeWebNavigation._url(wc);
    try {
      const frame = (wc.mainFrame.framesInSubtree || []).find((f) => f.routingId === routingId);
      return frame ? frame.url : '';
    } catch (_) {
      return '';
    }
  }
}

module.exports = ChromeWebNavigation;
