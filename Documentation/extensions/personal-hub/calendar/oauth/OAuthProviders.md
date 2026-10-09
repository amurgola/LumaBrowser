# OAuthProviders

`extensions/personal-hub/calendar/oauth/OAuthProviders.js`

Data only: the OAuth endpoints, scopes and extra consent parameters of the
calendar providers that need a sign-in.

- `GOOGLE`: `accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`,
  scope `calendar.readonly`, `access_type=offline` and `prompt=consent` (the
  pair that yields a refresh token on every sign-in).
- `microsoft(tenant)`: `login.microsoftonline.com/<tenant>/oauth2/v2.0/...`
  with `offline_access Calendars.Read User.Read`; the tenant defaults to
  `common`.
- `for(kind, config)`: the entry for a kind, or null for a kind without OAuth.
