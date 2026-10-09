# TriggerSourceConfig

`core/llm-server/chat/trigger-store/TriggerSourceConfig.js`

Normalises a trigger's `source` for [TriggerStore](../TriggerStore.md).

## Methods

- `TriggerSourceConfig.normalize(kind, source)`: the kind part plus the shared
  part. Shared, for every known kind: [TriggerGating](../triggers/TriggerGating.md)
  keys, [TriggerFailurePolicy](TriggerFailurePolicy.md) keys, `quietHours`
  ([QuietHours](../triggers/QuietHours.md)), `memory`
  ([TriggerMemoryPolicy](TriggerMemoryPolicy.md)), `approval` / `approvedTools`
  ([TriggerApprovalPolicy](TriggerApprovalPolicy.md)). Kinds:
  - `webhook`: `respond` (`ack` default or `result`), `preset`
    (`WebhookPresets.normalizePreset`), trimmed `dedupeHeader` / `authHeader`,
    `botGuard: false` only when turned off.
  - `notification`: `host` (lowercased, scheme, path and `www.` stripped) and/or
    `tabPartition` with `tabTitle` (200 chars) and `tabUrl` (500). Throws
    `a notification trigger needs a site (host) or a persisted tab (tabPartition)`.
  - `page`: `monitorId` (string), optional `url`, `name`. Throws
    `a page trigger needs a monitorId (a Page Watcher monitor)`.
  - `file`: `dir`, `glob` (`*`), `events` (known, deduplicated; default
    `add, change`), `settleMs` (FileWatch bounds 200 ms .. 60 s, default 1500),
    `recursive`, `allowWrite`, `catchUp` (default on). Throws `a file trigger needs a folder (dir)`.
  - Any other kind: the source copied as given.
- `TriggerSourceConfig.merge(current, patch)`: shallow merge where a patch
  `null` removes one of `CLEARABLE_KEYS` (gating, policy, quiet-hours, botGuard and memory keys).
- Constants `KINDS`, `RESPOND`, `CLEARABLE_KEYS`.

## Why

A notification trigger needs a scope so it never listens to every
notification. The webhook preset list is `WebhookPresets.PRESETS` and the file
event list and settle bounds are `FileWatch`'s, so there is one copy of each.
