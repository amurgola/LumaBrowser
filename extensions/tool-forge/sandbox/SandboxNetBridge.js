const SandboxPolicy = require('./SandboxPolicy');

class SandboxNetBridge {
  static FETCH_MAX_BYTES = 2 * 1024 * 1024;
  static FETCH_MAX_HEADERS = 24;

  constructor({ getLiveApi, safeFetch }) {
    this._getLiveApi = getLiveApi;
    this._safeFetch = safeFetch;
  }

  async handle(msg, active) {
    if (!msg || !active || msg.callId !== active.callId) {
      return { success: false, error: 'No active tool call for this request.' };
    }
    const url = msg.params && msg.params.url;
    if (!SandboxPolicy.hostAllowed(url, active.allowedHosts)) return SandboxNetBridge._hostRefused(url, active.allowedHosts);
    return this._dispatch(msg.op, msg.params);
  }

  _dispatch(op, params) {
    if (op === 'fetch') return this._fetch(params);
    const live = typeof this._getLiveApi === 'function' ? this._getLiveApi() : null;
    if (!live) return { success: false, error: 'Browser bridge is not available.' };
    if (op === 'fetchPage') return live.fetchPage(params);
    if (op === 'openTab') return live.openTab(params);
    return { success: false, error: `Unknown network op "${op}".` };
  }

  async _fetch(params) {
    if (typeof this._safeFetch !== 'function') return { success: false, error: 'fetch is not available.' };
    const res = await this._safeFetch(params.url, {
      method: params.method,
      headers: params.headers,
      body: params.body,
      timeoutMs: Number.isFinite(params.timeoutMs) ? params.timeoutMs : undefined,
      maxBytes: SandboxNetBridge.FETCH_MAX_BYTES,
    });
    if (!res || !res.ok) return { success: false, error: (res && res.error) || 'fetch failed', status: res && res.status };
    return {
      success: true,
      ok: true,
      status: res.status,
      url: res.finalUrl,
      headers: SandboxNetBridge._headerSubset(res),
      body: res.body,
      truncated: !!res.truncated,
    };
  }

  static _headerSubset(res) {
    const headers = {};
    let count = 0;
    for (const [key, value] of Object.entries(res.headers || { 'content-type': res.contentType })) {
      if (count >= SandboxNetBridge.FETCH_MAX_HEADERS) break;
      if (typeof value === 'string') { headers[key] = value; count += 1; }
    }
    return headers;
  }

  static _hostRefused(url, allowedHosts) {
    const list = allowedHosts.length ? allowedHosts.join(', ') : '(none declared)';
    return { success: false, error: `This tool is not allowed to reach "${url}". Its declared hosts are: ${list}.` };
  }
}

module.exports = SandboxNetBridge;
