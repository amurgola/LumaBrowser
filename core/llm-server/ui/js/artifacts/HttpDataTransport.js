import ArtifactDataTransport from './ArtifactDataTransport.js';

export default class HttpDataTransport extends ArtifactDataTransport {
  constructor({ base, token, readOnly, pollMs } = {}) {
    super();
    this._base = String(base || '').replace(/\/+$/, '');
    this._token = token;
    this._readOnly = !!readOnly;
    this._pollMs = pollMs || ArtifactDataTransport.DEFAULT_POLL_MS;
  }

  get readOnly() {
    return this._readOnly;
  }

  get pollMs() {
    return this._pollMs;
  }

  async all(rootId, since) {
    const res = await fetch(this._urlFor(rootId, since), { headers: this._headers(), credentials: 'same-origin' });
    if (res.status === 204) return { success: true, unchanged: true };
    return HttpDataTransport._body(res);
  }

  async mutate(rootId, ops) {
    const res = await fetch(this._urlFor(rootId), {
      method: 'POST', headers: this._headers(), credentials: 'same-origin',
      body: JSON.stringify(ops || {}),
    });
    return HttpDataTransport._body(res);
  }

  _urlFor(rootId, since) {
    const qs = [];
    if (since != null) qs.push('since=' + encodeURIComponent(since));
    if (this._token) qs.push('token=' + encodeURIComponent(this._token));
    return this._base + '/' + encodeURIComponent(rootId) + (qs.length ? '?' + qs.join('&') : '');
  }

  _headers() {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token) headers.Authorization = 'Bearer ' + this._token;
    return headers;
  }

  static async _body(res) {
    const body = await res.json().catch(() => null);
    if (!res.ok) return (body && body.error) ? body : { success: false, error: 'HTTP ' + res.status };
    return body || { success: false, error: 'empty response' };
  }
}
