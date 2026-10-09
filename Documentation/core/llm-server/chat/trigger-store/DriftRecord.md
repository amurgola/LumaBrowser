# DriftRecord

`core/llm-server/chat/trigger-store/DriftRecord.js`

The stored record of a trigger's payload drift (detected by
[PayloadDrift](../triggers/PayloadDrift.md)).

## Methods

- `DriftRecord.next(previous, drift, runId = null, now = new Date())` returns
  `{ isNew, drift }` where the record is `{ sig, missing, typeChanged, added,
  contentTypeChanged, firstAt, at, count, runId }`. A new `sig` starts at
  count 1; the same `sig` bumps the count and keeps `firstAt` and the earlier `runId`.
