const RequestLog = require('./network/RequestLog');
const WatcherForwarder = require('./network/WatcherForwarder');

class NetworkInterceptor {
  static FETCH_BODY_CAPTURE_PATTERNS = [{ urlPattern: '*', requestStage: 'Response' }];

  static NETWORK_BUFFERS = { maxResourceBufferSize: 10000000, maxTotalBufferSize: 100000000 };

  constructor(networkWatcherService) {
    this.watcherService = networkWatcherService;
    this.activeDebuggers = new Map();
    this._pendingRequests = new Map();
    this._requestLog = new RequestLog();
    this._forwarder = new WatcherForwarder(networkWatcherService);
    this._listening = new WeakSet();
    this._followWatcherChanges();
  }

  async attachToWebContents(webContents, tabId) {
    const webContentsId = webContents.id;
    if (this.activeDebuggers.has(webContentsId)) return;
    this._requestLog.mapTab(tabId, webContentsId);
    try {
      const fetchEnabled = await this._enableDomains(webContents);
      this.activeDebuggers.set(webContentsId, { webContents, attached: true, fetchEnabled });
      this._listenOnce(webContents, webContentsId, fetchEnabled);
    } catch (error) {
      console.error(`Failed to attach network interceptor to webContents ${webContentsId}:`, error);
    }
  }

  async syncFetchInterception() {
    const wanted = this._bodyCaptureWanted();
    for (const [webContentsId, info] of this.activeDebuggers) {
      if (!!info.fetchEnabled === wanted) continue;
      await this._setFetchInterception(webContentsId, info, wanted);
    }
  }

  getRequestLog(tabId) {
    return this._requestLog.forTab(tabId);
  }

  getAllRequestLogs() {
    return this._requestLog.all();
  }

  detachAll() {
    for (const [webContentsId, info] of this.activeDebuggers) NetworkInterceptor._detach(webContentsId, info);
    this.activeDebuggers.clear();
    this._pendingRequests.clear();
    this._requestLog.clearTabMappings();
  }

  _followWatcherChanges() {
    const svc = this.watcherService;
    if (!svc || typeof svc.onChange !== 'function') return;
    svc.onChange(() => { this.syncFetchInterception().catch(() => {}); });
  }

  async _enableDomains(webContents) {
    if (!webContents.debugger.isAttached()) webContents.debugger.attach('1.3');
    await webContents.debugger.sendCommand('Network.enable', NetworkInterceptor.NETWORK_BUFFERS);
    const fetchEnabled = this._bodyCaptureWanted();
    if (fetchEnabled) {
      await webContents.debugger.sendCommand('Fetch.enable', { patterns: NetworkInterceptor.FETCH_BODY_CAPTURE_PATTERNS });
    }
    return fetchEnabled;
  }

  _listenOnce(webContents, webContentsId, fetchEnabled) {
    if (this._listening.has(webContents)) {
      console.log(`Network interceptor re-attached to webContents ${webContentsId}`);
      return;
    }
    this._listening.add(webContents);
    webContents.debugger.on('message', (_event, method, params) => this._handleDebuggerMessage(webContentsId, method, params));
    webContents.debugger.on('detach', () => this._onForeignDetach(webContents, webContentsId));
    webContents.on('destroyed', () => this._onDestroyed(webContentsId));
    console.log(`Network interceptor attached to webContents ${webContentsId} (Network${fetchEnabled ? ' + Fetch' : ''} domain enabled)`);
  }

  _onForeignDetach(webContents, webContentsId) {
    setImmediate(() => {
      if (webContents.isDestroyed() || !this.activeDebuggers.has(webContentsId)) return;
      this.activeDebuggers.delete(webContentsId);
      this.attachToWebContents(webContents);
    });
  }

  _onDestroyed(webContentsId) {
    if (this.activeDebuggers.delete(webContentsId)) {
      console.log(`Network interceptor detached from webContents ${webContentsId} (destroyed)`);
    }
    this._requestLog.forget(webContentsId);
  }

  _bodyCaptureWanted() {
    const svc = this.watcherService;
    if (!svc) return false;
    if (typeof svc.wantsBodyCapture === 'function') return !!svc.wantsBodyCapture();
    if (typeof svc.getAllWatchers === 'function') {
      return svc.getAllWatchers().some((w) => w && w.enabled !== false && !!w.captureBody);
    }
    return false;
  }

  async _setFetchInterception(webContentsId, info, wanted) {
    const wc = info.webContents;
    try {
      if (!wc || wc.isDestroyed() || !wc.debugger.isAttached()) return;
      if (wanted) await wc.debugger.sendCommand('Fetch.enable', { patterns: NetworkInterceptor.FETCH_BODY_CAPTURE_PATTERNS });
      else await wc.debugger.sendCommand('Fetch.disable');
      info.fetchEnabled = wanted;
    } catch (error) {
      console.warn(`Network interceptor: Fetch.${wanted ? 'enable' : 'disable'} failed for webContents ${webContentsId}:`, error && error.message);
    }
  }

  _handleDebuggerMessage(webContentsId, method, params) {
    switch (method) {
      case 'Network.requestWillBeSent': return this._onRequestWillBeSent(webContentsId, params);
      case 'Network.responseReceived': return this._onResponseReceived(webContentsId, params);
      case 'Network.loadingFinished': return this._onLoadingFinished(webContentsId, params);
      case 'Network.loadingFailed': return this._pendingRequests.delete(params.requestId);
      case 'Fetch.requestPaused': return this._onFetchRequestPaused(webContentsId, params);
      default: return undefined;
    }
  }

  _onRequestWillBeSent(webContentsId, { requestId, request }) {
    const { url, method } = request;
    this._requestLog.add(webContentsId, requestId, { url, method });
    const matchingWatchers = this.watcherService.findMatchingWatchers(url, method);
    if (matchingWatchers.length === 0) return;
    this._pendingRequests.set(requestId, {
      webContentsId, url, method, headers: request.headers, matchingWatchers, timestamp: new Date().toISOString(),
    });
    console.log(`[Network] Watcher triggered for ${method} ${url}`, {
      networkRequestId: requestId,
      watcherCount: matchingWatchers.length,
      captureBody: NetworkInterceptor._wantsBody(matchingWatchers),
      captureHeaders: matchingWatchers.some((w) => w.captureHeaders),
    });
  }

  _onResponseReceived(webContentsId, { requestId, response }) {
    this._requestLog.recordResponse(webContentsId, requestId, response);
    const requestInfo = this._pendingRequests.get(requestId);
    if (!requestInfo) return;
    requestInfo.response = {
      status: response.status, statusText: response.statusText, headers: response.headers, mimeType: response.mimeType,
    };
    console.log(`[Network] Response received for ${requestInfo.url}`, {
      networkRequestId: requestId,
      status: response.status,
      mimeType: response.mimeType,
      contentLength: response.headers?.['content-length'],
    });
  }

  async _onLoadingFinished(webContentsId, { requestId }) {
    const requestInfo = this._pendingRequests.get(requestId);
    if (!requestInfo) return;
    try {
      const dbg = this._attachedDebugger(webContentsId);
      if (!dbg) return;
      const body = await this._responseBody(dbg, requestId, requestInfo);
      this._forwarder.forward(requestInfo, body);
    } catch (error) {
      console.error(`Error processing network response for ${requestInfo.url}:`, error);
    } finally {
      this._pendingRequests.delete(requestId);
    }
  }

  async _responseBody(dbg, requestId, requestInfo) {
    const captured = NetworkInterceptor._fetchCapturedBody(requestInfo);
    if (captured) {
      console.log(`[Fetch] Using response body captured by Fetch domain for ${requestInfo.url} (${captured.body.length} bytes, base64: ${captured.base64Encoded})`);
      return captured;
    }
    if (!NetworkInterceptor._wantsBody(requestInfo.matchingWatchers)) return null;
    return NetworkInterceptor._networkBody(dbg, requestId, requestInfo);
  }

  static _fetchCapturedBody(requestInfo) {
    const body = requestInfo.response?.body || requestInfo.fetchBody || null;
    if (!body) return null;
    return { body, base64Encoded: requestInfo.response?.base64Encoded || requestInfo.fetchBase64 || false };
  }

  static async _networkBody(dbg, requestId, requestInfo) {
    console.log(`[Network] Fetch didn't capture body, trying Network.getResponseBody for ${requestInfo.url}`);
    try {
      const result = await dbg.sendCommand('Network.getResponseBody', { requestId });
      console.log(`[Network] Successfully captured response body for ${requestInfo.url} (${result.body ? result.body.length : 0} bytes, base64: ${result.base64Encoded})`);
      return { body: result.body, base64Encoded: result.base64Encoded };
    } catch (error) {
      console.error(`[Network] Failed to capture response body for ${requestInfo.url}:`, {
        error: error.message,
        mimeType: requestInfo.response?.mimeType,
        status: requestInfo.response?.status,
        url: requestInfo.url,
        hint: 'Both Fetch and Network domains failed to capture the response body.',
      });
      return null;
    }
  }

  async _onFetchRequestPaused(webContentsId, params) {
    const dbg = this._attachedDebugger(webContentsId);
    if (!dbg) return;
    try {
      await this._captureFetchBody(dbg, params);
      await dbg.sendCommand('Fetch.continueRequest', { requestId: params.requestId });
    } catch (error) {
      console.error('[Fetch] Error handling paused request:', error);
      await NetworkInterceptor._continueAfterError(dbg, params.requestId);
    }
  }

  async _captureFetchBody(dbg, { requestId, request, networkId }) {
    const requestInfo = this._pendingFor(networkId, request?.url || '');
    if (!requestInfo || !NetworkInterceptor._wantsBody(requestInfo.matchingWatchers)) return;
    console.log(`[Fetch] Attempting to capture body for ${request?.url || ''}`);
    try {
      const result = await dbg.sendCommand('Fetch.getResponseBody', { requestId });
      NetworkInterceptor._storeFetchBody(requestInfo, result);
      console.log(`[Fetch] Successfully captured response body for ${requestInfo.url} (${result.body ? result.body.length : 0} bytes, base64: ${result.base64Encoded})`);
    } catch (bodyError) {
      console.error(`[Fetch] Failed to get response body for ${requestInfo.url}:`, bodyError.message);
    }
  }

  _pendingFor(networkId, url) {
    const byId = networkId ? this._pendingRequests.get(networkId) : null;
    if (byId || !url) return byId || null;
    for (const info of this._pendingRequests.values()) {
      if (info.url === url) {
        console.log(`[Fetch] Matched request by URL instead of networkId: ${url}`);
        return info;
      }
    }
    return null;
  }

  static _storeFetchBody(requestInfo, result) {
    requestInfo.fetchBody = result.body;
    requestInfo.fetchBase64 = result.base64Encoded;
    if (requestInfo.response) {
      requestInfo.response.body = result.body;
      requestInfo.response.base64Encoded = result.base64Encoded;
    }
  }

  static async _continueAfterError(dbg, requestId) {
    try {
      await dbg.sendCommand('Fetch.continueRequest', { requestId });
    } catch (continueError) {
      console.error('[Fetch] Failed to continue request:', continueError);
    }
  }

  _attachedDebugger(webContentsId) {
    const info = this.activeDebuggers.get(webContentsId);
    if (!info || !info.webContents.debugger.isAttached()) return null;
    return info.webContents.debugger;
  }

  static _wantsBody(watchers) {
    return watchers.some((w) => w.captureBody);
  }

  static _detach(webContentsId, info) {
    try {
      if (info.webContents.debugger.isAttached()) info.webContents.debugger.detach();
    } catch (error) {
      console.error(`Error detaching debugger from webContents ${webContentsId}:`, error);
    }
  }
}

module.exports = NetworkInterceptor;
