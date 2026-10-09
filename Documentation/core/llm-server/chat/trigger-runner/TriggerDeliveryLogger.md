# TriggerDeliveryLogger

`core/llm-server/chat/trigger-runner/TriggerDeliveryLogger.js`

Writes the trigger delivery log ([TriggerDeliveryLog](../trigger-store/TriggerDeliveryLog.md))
for the runner. Never throws, so a log failure cannot stop a delivery.

## Methods

- `new TriggerDeliveryLogger({ triggerStore, emitEvent? })`.
- `log(triggerId, event, { id, outcome, detail, runId, dedupeKey, source =
  'webhook', remote })`: with `id` the row is moved on
  (`updateDelivery(id, { outcome, detail, runId })`) and `id` is returned;
  otherwise a row is recorded, `delivery` `{ triggerId, deliveryId, outcome,
  detail }` is emitted and the new id is returned. On a store error it returns
  the given `id` (or null).
