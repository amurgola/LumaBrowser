# HeaderRedactor

`core/network-watcher/HeaderRedactor.js`

Security control: strips credential-bearing headers from network-watcher
captures before they are persisted (`lastCapturedResponse`) and before they
are forwarded to a webhook.

## Methods

- `HeaderRedactor.redactHeaders(headers)` returns a copy without `Cookie`,
  `Authorization`, `Set-Cookie` and `Proxy-Authorization`, matched
  case-insensitively. Non-object input (null, undefined, strings, arrays) is
  returned untouched.
- `HeaderRedactor.redactCapturePayload(requestData)` redacts a capture of
  shape `{ request: { headers }, response: { headers } }`. Shallow copy: the
  nested header objects are replaced, everything else is shared. A section
  without headers does not gain a `headers` key.
- `HeaderRedactor.REDACTED_HEADERS` is the frozen lowercase list.

## Why it is always on

Owner decision 2026-08-05 (legacy BUG_BACKLOG "Network-watcher captures
credentials"). With `networkMode: 'any'` on a 0.0.0.0 bind as the intended
ship posture, the network layer is not a mitigation; this list is the only
control on the path. There is deliberately no opt-out, and the list must
never shrink. Both callers apply it: NetworkInterceptor on the headers it
captures, and NetworkWatcherService as the choke point before persist and
forward, because the test-webhook route builds payloads independently.
