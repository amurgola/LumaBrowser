# PendingSyntheses

`core/tts-server/PendingSyntheses.js`

The synthesis requests in flight in the sherpa TTS worker, keyed by request id.

## Methods

- `add(id, { onChunk, resolve, reject })`.
- `chunk(id, payload)` calls the request's `onChunk`; returns whether the id is
  known. A throwing listener is contained.
- `resolve(id, value)` / `reject(id, err)` settle and remove the request; return
  whether it was there, so a late `done` after a cancel is a no-op.
- `rejectAll(err)` fails and removes every request (worker exit).
- `has(id)`, getter `size` (the idle timer stays disarmed while it is above 0).

## Why

Same shape as the STT backend's `PendingTranscriptions`, minus per-request
timeouts (a long text legitimately streams for a long time) and plus chunk
routing.
