const crypto = require('crypto');
const OAuthProviders = require('./OAuthProviders');
const OAuthTokens = require('./OAuthTokens');

class OAuthFlow {
  static STATE_TTL_MS = 10 * 60 * 1000;

  constructor({ tokens, fetchImpl = null, now = () => Date.now(), random = (n) => crypto.randomBytes(n) } = {}) {
    if (!tokens) throw new Error('OAuthFlow requires an OAuthTokens store');
    this._tokens = tokens;
    this._fetch = fetchImpl;
    this._now = now;
    this._random = random;
    this._pending = new Map();
  }

  begin({ sourceId, kind, config = {}, clientId, clientSecret = '', redirectUri }) {
    const provider = OAuthProviders.for(kind, config);
    if (!provider) throw new Error(`"${kind}" calendars do not use OAuth`);
    if (!clientId) throw new Error('An OAuth client id is required');
    if (!redirectUri) throw new Error('A redirect URI is required');
    this._prune();
    const verifier = OAuthFlow._base64url(this._random(32));
    const state = OAuthFlow._base64url(this._random(16));
    this._pending.set(state, { sourceId, provider, clientId, clientSecret, redirectUri, verifier, expiresAt: this._now() + OAuthFlow.STATE_TTL_MS });
    return { url: OAuthFlow._authUrl(provider, { clientId, redirectUri, state, verifier }), state };
  }

  async complete({ state, code, error } = {}) {
    if (error) return { success: false, error: `Sign-in refused: ${error}` };
    const pending = this._take(state);
    if (!pending) return { success: false, error: 'This sign-in link is unknown or has expired; start again.' };
    if (!code) return { success: false, error: 'The provider sent no authorization code.' };
    try {
      const body = await this._exchange(pending, code);
      this._tokens.set(pending.sourceId, OAuthTokens.fromTokenResponse(body, this._tokens.get(pending.sourceId), this._now()));
      return { success: true, sourceId: pending.sourceId };
    } catch (err) {
      return { success: false, error: err.message, sourceId: pending.sourceId };
    }
  }

  pendingCount() {
    this._prune();
    return this._pending.size;
  }

  static _authUrl(provider, { clientId, redirectUri, state, verifier }) {
    const url = new URL(provider.authUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', provider.scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', OAuthFlow._base64url(crypto.createHash('sha256').update(verifier).digest()));
    url.searchParams.set('code_challenge_method', 'S256');
    for (const [key, value] of Object.entries(provider.extraAuthParams || {})) url.searchParams.set(key, value);
    return url.href;
  }

  async _exchange(pending, code) {
    const doFetch = this._fetch || globalThis.fetch;
    const form = new URLSearchParams({
      grant_type: 'authorization_code', code, code_verifier: pending.verifier, client_id: pending.clientId, redirect_uri: pending.redirectUri,
    });
    if (pending.clientSecret) form.set('client_secret', pending.clientSecret);
    const response = await doFetch(pending.provider.tokenUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(),
    });
    let body = {};
    try { body = await response.json(); } catch (_) {}
    if (!response.ok || !body.access_token) {
      throw new Error(`Token exchange failed: ${body.error_description || body.error || `HTTP ${response.status}`}`);
    }
    return body;
  }

  _take(state) {
    this._prune();
    const pending = state ? this._pending.get(String(state)) : null;
    if (pending) this._pending.delete(String(state));
    return pending || null;
  }

  _prune() {
    const now = this._now();
    for (const [state, entry] of this._pending) {
      if (entry.expiresAt <= now) this._pending.delete(state);
    }
  }

  static _base64url(buffer) {
    return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

module.exports = OAuthFlow;
