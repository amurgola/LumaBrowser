# Faults

`extensions/site-apis/spec/Faults.js`

The fault codes an endpoint run can end with and their one shape: `{ code, message, retryable, step?, detail? }`.

- Codes: `invalid_params`, `unknown_endpoint`, `browser_unavailable`, `site_unavailable`, `needs_login`,
  `interstitial`, `step_failed`, `timeout`, `shape_mismatch`, `aborted`.
- `RETRYABLE`: `site_unavailable`, `interstitial`, `step_failed`, `timeout` (the retry policy only retries these).
- `make(code, message, { step, detail })`: an unknown code becomes `step_failed`.
- `advice(fault)`: the one-line "what to do" every surface appends (sign in for `needs_login`, check params, the
  endpoint may need re-recording, ...).
