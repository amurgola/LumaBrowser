# StatusText

`extensions/site-apis/ui/StatusText.js`

The wording and badge classes of the Site APIs settings page.

## Methods

- `sitePill(site)`: `{ cls, label, title }`: `ok` Signed in, `signed_out` Signed out (bad), anything else Unknown
  (muted); the statusNote is the title.
- `endpointPill(status)`: validated (ok), draft (muted), broken (bad).
- `lastRun(lastRun)`: `never run`, `ok 2 min ago (1.2s)` or `fault needs_login 2 min ago (4.2s)` from the endpoint's
  `lastRun` summary `{ at, ok, fault, durationMs }`.
- `params(params)`: `no params` or `q (string, required), limit (number, default 10)`.
- `duration(ms)`: `850ms`, `4.2s`, `1.5m`.
- `fault(fault, advice)`: `code at step N: message advice`.
- `summary(sites)`: `No site APIs yet.` or `2 sites, 5 endpoints, 3 validated.`
