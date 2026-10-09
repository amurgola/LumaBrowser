# IpcFailure

`core/llm-server/ipc/IpcFailure.js`

Builds the error a service throws when its IPC failure reply must carry extra
fields, so `IpcEnvelope.enveloped` produces `{ success: false, error, ...fields }`.

## Methods

- `IpcFailure.of(message, fields)` an Error with `fields` as own properties.
- `IpcFailure.withCode(err)` an Error with `err`'s message and `code: err.code || null`
  (other fields of `err` are dropped).

## Why

Legacy handlers replied `{ success: false, error, code: err.code || null }` by
hand; the renderer branches on `code` (for example `HF_NOT_FOUND`).
