class OAuthTokens {
  static ID_PREFIX = 'hub:cal:';
  static ID_SUFFIX = ':tokens';
  static REFRESH_MARGIN_MS = 60 * 1000;

  constructor({ secrets, fetchImpl = null, now = () => Date.now() } = {}) {
    if (!secrets) throw new Error('OAuthTokens requires a secrets store');
    this._secrets = secrets;
    this._fetch = fetchImpl;
    this._now = now;
  }

  static idFor(sourceId) {
    return `${OAuthTokens.ID_PREFIX}${sourceId}${OAuthTokens.ID_SUFFIX}`;
  }

  get(sourceId) {
    const raw = this._secrets.get(OAuthTokens.idFor(sourceId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  set(sourceId, tokens) {
    this._secrets.set(OAuthTokens.idFor(sourceId), JSON.stringify(tokens || {}));
  }

  clear(sourceId) {
    this._secrets.delete(OAuthTokens.idFor(sourceId));
  }

  isConnected(sourceId) {
    const tokens = this.get(sourceId);
    return !!(tokens && (tokens.refreshToken || tokens.accessToken));
  }

  async accessToken(sourceId, { tokenUrl, clientId, clientSecret = '', label = 'Calendar', fetchImpl = null } = {}) {
    const tokens = this.get(sourceId);
    if (!tokens || (!tokens.accessToken && !tokens.refreshToken)) throw new Error(`${label}: sign in again`);
    if (tokens.accessToken && OAuthTokens._fresh(tokens, this._now())) return tokens.accessToken;
    if (!tokens.refreshToken) throw new Error(`${label}: sign in again (the access token expired and there is no refresh token)`);
    const refreshed = await this._refresh(tokens, { tokenUrl, clientId, clientSecret, label, fetchImpl });
    this.set(sourceId, refreshed);
    return refreshed.accessToken;
  }

  static fromTokenResponse(body, previous, nowMs) {
    const expiresIn = Number(body && body.expires_in);
    return {
      accessToken: body && body.access_token ? String(body.access_token) : '',
      refreshToken: (body && body.refresh_token) ? String(body.refresh_token) : ((previous && previous.refreshToken) || ''),
      expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(nowMs + expiresIn * 1000).toISOString() : null,
      scope: body && body.scope ? String(body.scope) : ((previous && previous.scope) || ''),
    };
  }

  static _fresh(tokens, nowMs) {
    if (!tokens.expiresAt) return true;
    const expires = Date.parse(tokens.expiresAt);
    return Number.isFinite(expires) && expires - nowMs > OAuthTokens.REFRESH_MARGIN_MS;
  }

  async _refresh(tokens, { tokenUrl, clientId, clientSecret, label, fetchImpl }) {
    const doFetch = fetchImpl || this._fetch || globalThis.fetch;
    const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken, client_id: clientId || '' });
    if (clientSecret) form.set('client_secret', clientSecret);
    let response;
    try {
      response = await doFetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    } catch (err) {
      throw new Error(`${label}: token refresh failed (${err.message})`);
    }
    const body = await OAuthTokens._json(response);
    if (!response.ok || !body.access_token) {
      throw new Error(`${label}: sign in again (refresh refused: ${body.error_description || body.error || `HTTP ${response.status}`})`);
    }
    return OAuthTokens.fromTokenResponse(body, tokens, this._now());
  }

  static async _json(response) {
    try { return await response.json(); } catch (_) { return {}; }
  }
}

module.exports = OAuthTokens;
