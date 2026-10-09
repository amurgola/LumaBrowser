class InternalTabLoader {
  static ERR_ABORTED = -3;
  static DEFAULT_RETRIES = 8;
  static DEFAULT_RETRY_DELAY_MS = 600;

  static wire(service, wc, options = {}) {
    const loader = new InternalTabLoader(service, wc, options);
    loader._attach();
    return loader;
  }

  static reloadIfStale(service, wc) {
    if (InternalTabLoader._isServingFile(service)) return;
    if (!wc || wc.isDestroyed()) return;
    if (service.tabLoadedOk && wc.getURL() === service.tabHtmlUrl) return;
    wc.loadURL(service.tabHtmlUrl).catch(() => {});
  }

  static _isServingFile(service) {
    return service.tabHtmlUrl === service.tabHtmlFileUrl;
  }

  constructor(service, wc, { retries = InternalTabLoader.DEFAULT_RETRIES, retryDelayMs = InternalTabLoader.DEFAULT_RETRY_DELAY_MS } = {}) {
    this._service = service;
    this._wc = wc;
    this._retries = retries;
    this._retryDelayMs = retryDelayMs;
    this._navFailed = false;
    this._attempts = 0;
  }

  _attach() {
    this._service.tabLoadedOk = false;
    this._wc.on('did-start-navigation', (_e, _url, _isInPlace, isMainFrame) => this._onStartNavigation(isMainFrame));
    this._wc.on('did-fail-load', (_e, errorCode, _desc, _validatedURL, isMainFrame) => this._onFailLoad(errorCode, isMainFrame));
    this._wc.on('did-finish-load', () => this._onFinishLoad());
  }

  _onStartNavigation(isMainFrame) {
    if (isMainFrame) this._navFailed = false;
  }

  _onFailLoad(errorCode, isMainFrame) {
    if (!isMainFrame || errorCode === InternalTabLoader.ERR_ABORTED) return;
    this._navFailed = true;
    this._service.tabLoadedOk = false;
    if (InternalTabLoader._isServingFile(this._service)) return;
    this._attempts += 1;
    this._scheduleRetry(this._nextUrl());
  }

  _onFinishLoad() {
    this._service.tabLoadedOk = !this._navFailed;
    if (this._service.tabLoadedOk) this._attempts = 0;
  }

  _nextUrl() {
    return this._attempts <= this._retries ? this._service.tabHtmlUrl : this._service.tabHtmlFileUrl;
  }

  _scheduleRetry(url) {
    setTimeout(() => {
      if (!this._wc.isDestroyed() && !this._service.tabLoadedOk) this._wc.loadURL(url).catch(() => {});
    }, this._retryDelayMs);
  }
}

module.exports = InternalTabLoader;
