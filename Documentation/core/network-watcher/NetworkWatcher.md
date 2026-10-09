# NetworkWatcher

`core/network-watcher/NetworkWatcher.js`

Model for one network watcher: a URL wildcard pattern and HTTP method that,
when matched, capture the exchange and optionally forward it to a webhook.

## Methods

- `new NetworkWatcher(config)` takes `{ id, urlPattern, sendTo, note,
  enabled, method, captureHeaders, captureBody, createdAt, lastTriggered,
  triggerCount, lastCapturedResponse }` and validates. Defaults: generated id
  `watcher_<ms>_<rand>`, `enabled: true`, `method: '*'`, capture flags
  `false`, `triggerCount: 0`.
- `NetworkWatcher.fromJSON(data)` is `new NetworkWatcher(data)`.
- `validate()` throws when `urlPattern` is missing or not a string, or when
  `sendTo` is set but is not a string, not a URL, or not http/https.
- `matches(url, method = 'GET')` is false when disabled; otherwise checks the
  method (`'*'` matches all, case-insensitive) and the anchored,
  case-insensitive wildcard pattern (`*` any run, `?` one character, all else
  literal).
- `recordTrigger()` stamps `lastTriggered` and increments `triggerCount`.
- `toJSON()` returns every field as a plain object.

## Why

- Capture is opt-in (owner decision 2026-08-05). Persisted watchers are
  unaffected because `toJSON` always wrote explicit values. Even with
  `captureHeaders` on, credential headers are stripped by HeaderRedactor.
- Webhooks are http/https only. axios never spoke anything else, so other
  schemes (`file:`, `ws:`, `javascript:`) are rejected at save time instead
  of failing at forward time.
