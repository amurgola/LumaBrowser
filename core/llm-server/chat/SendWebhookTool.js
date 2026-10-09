class SendWebhookTool {
  static TIMEOUT_MS = 15 * 1000;
  static MAX_RESPONSE_CHARS = 500;
  static METHODS = new Set(['POST', 'PUT', 'PATCH']);
  static BLOCKED_HEADERS = new Set(['host', 'content-length', 'transfer-encoding', 'connection']);

  constructor({ fetchImpl = fetch, timeoutMs = SendWebhookTool.TIMEOUT_MS } = {}) {
    this._fetch = fetchImpl;
    this._timeoutMs = timeoutMs;
  }

  async execute(params = {}) {
    const request = {};
    const error = SendWebhookTool._resolveUrl(params, request)
      || SendWebhookTool._resolveMethod(params, request)
      || SendWebhookTool._resolveBody(params, request);
    if (error) return { success: false, error };
    SendWebhookTool._resolveHeaders(params, request);
    return this._deliver(request);
  }

  static _resolveUrl(params, request) {
    const url = params.url && String(params.url).trim();
    if (!url) return 'send_webhook requires "url" (the endpoint to call).';
    try { request.url = new URL(url); } catch (_) { return `send_webhook: "${url}" is not a valid URL.`; }
    if (request.url.protocol !== 'http:' && request.url.protocol !== 'https:') {
      return 'send_webhook: only http(s) endpoints are supported.';
    }
    return null;
  }

  static _resolveMethod(params, request) {
    request.method = String(params.method || 'POST').toUpperCase();
    if (SendWebhookTool.METHODS.has(request.method)) return null;
    return `send_webhook: method must be POST, PUT, or PATCH (got "${params.method}").`;
  }

  static _resolveBody(params, request) {
    const payload = params.payload !== undefined ? params.payload : params.body;
    if (payload === undefined || payload === null) {
      Object.assign(request, { body: '{}', contentType: 'application/json' });
    } else if (typeof payload === 'string') {
      Object.assign(request, { body: payload, contentType: 'text/plain; charset=utf-8' });
    } else {
      try { request.body = JSON.stringify(payload); } catch (err) {
        return `send_webhook: payload is not serializable (${err.message}).`;
      }
      request.contentType = 'application/json';
    }
    return null;
  }

  static _resolveHeaders(params, request) {
    request.headers = { 'content-type': request.contentType };
    const extra = params.headers;
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return;
    for (const [name, value] of Object.entries(extra)) {
      const key = String(name).toLowerCase();
      if (SendWebhookTool.BLOCKED_HEADERS.has(key)) continue;
      if (typeof value === 'string' || typeof value === 'number') request.headers[key] = String(value);
    }
  }

  async _deliver(request) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);
    if (timer.unref) timer.unref();
    try {
      const res = await this._fetch(request.url.toString(), {
        method: request.method, headers: request.headers, body: request.body, signal: controller.signal, redirect: 'follow',
      });
      return SendWebhookTool._toResult(request, res, await SendWebhookTool._snippet(res));
    } catch (err) {
      return { success: false, error: `send_webhook failed: ${this._failureReason(err)}` };
    } finally {
      clearTimeout(timer);
    }
  }

  static async _snippet(res) {
    try { return String(await res.text()).slice(0, SendWebhookTool.MAX_RESPONSE_CHARS); } catch (_) { return ''; }
  }

  static _toResult(request, res, snippet) {
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        response: snippet,
        error: `the endpoint answered ${res.status}${snippet ? `: ${snippet}` : ''}`,
      };
    }
    const target = `${request.url.origin}${request.url.pathname}`;
    return {
      success: true,
      status: res.status,
      response: snippet,
      message: `Delivered (${request.method} ${target} → ${res.status}). Tell the user it was sent.`,
    };
  }

  _failureReason(err) {
    if (err && err.name === 'AbortError') return `timed out after ${Math.round(this._timeoutMs / 1000)}s`;
    return (err && err.message) || String(err);
  }
}

module.exports = SendWebhookTool;
