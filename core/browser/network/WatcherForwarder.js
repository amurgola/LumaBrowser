const HeaderRedactor = require('../../network-watcher/HeaderRedactor');

class WatcherForwarder {
  constructor(watcherService) {
    this._watcherService = watcherService;
  }

  forward(requestInfo, body) {
    const clean = WatcherForwarder._redactedHeaders(requestInfo);
    for (const watcher of requestInfo.matchingWatchers) {
      const payload = WatcherForwarder.buildPayload(requestInfo, watcher, clean, body);
      this._send(watcher, payload, requestInfo);
    }
  }

  static buildPayload(requestInfo, watcher, clean, body) {
    const response = requestInfo.response;
    const payload = {
      url: requestInfo.url,
      method: requestInfo.method,
      timestamp: requestInfo.timestamp,
      request: watcher.captureHeaders ? { headers: clean.request } : {},
      response: { status: response?.status, statusText: response?.statusText, mimeType: response?.mimeType },
    };
    if (watcher.captureHeaders && clean.response) payload.response.headers = clean.response;
    if (watcher.captureBody && body && body.body) {
      payload.response.body = body.body;
      payload.response.base64Encoded = body.base64Encoded;
    }
    return payload;
  }

  static _redactedHeaders(requestInfo) {
    return {
      request: HeaderRedactor.redactHeaders(requestInfo.headers),
      response: HeaderRedactor.redactHeaders(requestInfo.response?.headers),
    };
  }

  _send(watcher, payload, requestInfo) {
    this._watcherService.forwardToWebhook(watcher, payload).then((result) => {
      if (result.success) console.log(`Forwarded ${requestInfo.method} ${requestInfo.url} to ${watcher.sendTo}`);
      else console.error(`Failed to forward to ${watcher.sendTo}:`, result.error);
    });
  }
}

module.exports = WatcherForwarder;
