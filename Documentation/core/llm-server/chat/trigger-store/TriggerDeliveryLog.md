# TriggerDeliveryLog

`core/llm-server/chat/trigger-store/TriggerDeliveryLog.js`

A trigger's delivery log (`llm_trigger_deliveries`) over
[TriggerDeliveryRepository](TriggerDeliveryRepository.md): one row per inbound
event whatever happened to it, so "why didn't it fire?" has an answer.

## Methods

- `record(triggerId, { source = 'webhook', outcome, detail?, runId?, dedupeKey?, remote?, event? })`:
  an unknown outcome is stored as `error`; `detail` 500 chars, `remote` 80; the
  event is [DeliveryEventSummary](DeliveryEventSummary.md)`.compact` capped at
  4 K. The trigger's log is then pruned to the newest `KEEP` (200), best-effort.
- `update(id, { outcome, detail?, runId? })`: moves a delivery on; a missing
  detail or run id keeps the stored one, and a stored `shape drift: ...` note
  is appended to a new detail that lacks one. `null` for no id.
- `get(id)`, `list(triggerId, { limit = 50, offset = 0 })` (newest first, limit
  capped at `KEEP`), `counts(triggerId)` (`{ outcome: n }`), `deleteForTrigger(triggerId)`.
- `OUTCOMES`: captured, queued, fired, duplicate, unarmed, rate_limited,
  rejected, no_secret, handshake, queue_dropped, dropped, error, filtered,
  cooldown, batched, retry_scheduled, deferred, quiet.
