export default class HostApi {
  constructor({ http, token, userAgent = '' }) {
    this._http = http;
    this._token = token;
    this._userAgent = userAgent;
  }

  async info() {
    const res = await this._http.fetch('/sharing/info', { cache: 'no-store' });
    if (!res.ok) throw new Error('Host not reachable');
    return res.json();
  }

  async pair(pin) {
    const res = await this._http.fetch('/sharing/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: String(pin || '').trim(), peerHint: 'Web · ' + HostApi.platformHint(this._userAgent) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw HostApi._pairError(res.status, data);
    this._token.set(data.token);
    this._token.setHostName(data.name || '');
    return { name: data.name || '' };
  }

  async listModels() {
    const res = await this._http.authed('/sharing/llm/v1/models', { cache: 'no-store' });
    this._http.throwIfUnauthorized(res);
    if (!res.ok) throw new Error('Could not load models');
    const data = await res.json();
    return (data.data || []).map((m) => ({ id: m.id, label: m.luma_label || m.id, kind: m.luma_kind || 'remote' }));
  }

  async hostCapabilities() {
    try {
      const res = await this._http.authed('/sharing/resources', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.thinking ? data.thinking : null;
    } catch (_) {
      return null;
    }
  }

  listAgents() {
    return this._listed('/sharing/agents', 'agents');
  }

  listChatModes() {
    return this._listed('/sharing/chat/modes', 'modes');
  }

  async fetchArtifact(id) {
    const res = await this._http.authed('/sharing/artifacts/' + encodeURIComponent(id));
    this._http.throwIfUnauthorized(res);
    if (!res.ok) throw new Error('Artifact not found');
    return res.json();
  }

  async _listed(url, key) {
    const res = await this._http.authed(url, { cache: 'no-store' });
    this._http.throwIfUnauthorized(res);
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data[key]) ? data[key] : [];
  }

  static platformHint(userAgent) {
    const ua = userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/android/i.test(ua)) return 'Android';
    if (/macintosh/i.test(ua)) return 'Mac';
    if (/windows/i.test(ua)) return 'Windows';
    if (/linux/i.test(ua)) return 'Linux';
    return 'browser';
  }

  static _pairError(status, data) {
    const err = new Error(data.error || (status === 429 ? 'Too many attempts. Wait and retry.' : 'Pairing failed'));
    err.status = status;
    return err;
  }
}
