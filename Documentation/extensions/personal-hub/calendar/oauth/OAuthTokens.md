# OAuthTokens

`extensions/personal-hub/calendar/oauth/OAuthTokens.js`

A calendar source's OAuth tokens, kept in the encrypted secrets store
(TriggerSecrets, so Electron `safeStorage` when a keychain exists) under
`hub:cal:<sourceId>:tokens`, and refreshed just before the access token
expires.

## Methods

- `new OAuthTokens({ secrets, fetchImpl, now })`.
- `get(sourceId)` -> `{ accessToken, refreshToken, expiresAt, scope } | null`;
  `set(sourceId, tokens)`; `clear(sourceId)`; `isConnected(sourceId)`.
- `async accessToken(sourceId, { tokenUrl, clientId, clientSecret, label, fetchImpl })`:
  the stored access token when it is good for more than 60 s, else a refresh
  (`grant_type=refresh_token`) whose reply is persisted (an old refresh token
  is kept when the reply has none). Throws `"<label>: sign in again"` when
  there are no tokens, no refresh token, or the refresh is refused, which
  CalendarService records as the source's last error.
- `static fromTokenResponse(body, previous, nowMs)`: the token endpoint's JSON
  to a stored record (`expires_in` becomes an absolute `expiresAt`).

Tokens never appear in a listed source, an event or a tool reply; only the
bearer value for one request leaves this class.
