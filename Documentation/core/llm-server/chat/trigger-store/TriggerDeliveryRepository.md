# TriggerDeliveryRepository

`core/llm-server/chat/trigger-store/TriggerDeliveryRepository.js`

Plain SQL over `llm_trigger_deliveries`; returns raw rows.

## Methods

`insert(row)`, `update(id, outcome, detail, runId)` (a null detail or run id
keeps the stored value), `get(id)`, `list(triggerId, limit, offset)` (newest
first), `counts(triggerId)` (`[{ outcome, n }]`), `prune(triggerId, keep)`
(keeps the newest `keep`), `deleteForTrigger(triggerId)`.
