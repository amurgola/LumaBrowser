# OAuthFlow

`extensions/personal-hub/calendar/oauth/OAuthFlow.js`

The PKCE (S256) authorization-code flow a calendar source signs in with. The
app is itself a browser, so the consent page opens in a tab and the provider
redirects to the local REST gateway (`/api/hub/oauth/callback`), which hands
`state` and `code` back here.

## Methods

- `new OAuthFlow({ tokens, fetchImpl, now, random })`: `tokens` is an
  [OAuthTokens](OAuthTokens.md); the rest are test seams.
- `begin({ sourceId, kind, config, clientId, clientSecret, redirectUri })` ->
  `{ url, state }`. Builds the consent URL from
  [OAuthProviders](OAuthProviders.md) with `code_challenge`, parks the verifier
  and the client secret under a random `state` for ten minutes. Throws for a
  kind without OAuth or a missing client id / redirect URI.
- `async complete({ state, code, error })` -> `{ success, sourceId }` or
  `{ success: false, error }`. Checks and consumes the state, POSTs the
  form-encoded exchange (`grant_type=authorization_code`, `code`,
  `code_verifier`, `client_id`, `client_secret` when set, `redirect_uri`) and
  stores the tokens. Never throws.
- `pendingCount()`: live states (for diagnostics).

## Why

The state is single-use and expires, so a stale or replayed callback cannot
attach tokens to a source. The verifier never leaves the main process.
