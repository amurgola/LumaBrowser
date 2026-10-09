# SdcppPayload

`core/image-server/server/image/SdcppPayload.js`

Reads sd-server job payloads (progress, previews, failure messages), whose field
names vary across builds, and parses environment budgets.

## Methods

- `SdcppPayload.progressOf(data)` looks in `data.progress`, then
  `data.status_detail`, then `data` itself for a numeric step
  (`step`, `current_step`, `sample_step`) and total (`total_steps`, `steps`,
  `sample_steps`). Returns `{ step, totalSteps }` (either may be null) or `null`
  when neither is present.
- `SdcppPayload.previewOf(data)` returns `{ bytes, mime }` from
  `data.preview.b64_json` or `.b64` (mime defaults to `image/png`), else `null`.
- `SdcppPayload.errorMessage(err)` returns a readable message: strings as-is,
  objects via `message`, `error`, `detail`, else their JSON; `null` gives `''`.
- `SdcppPayload.stringify(value)` is JSON for objects, the string for strings,
  `String(value)` when JSON fails.
- `SdcppPayload.positiveInt(value, fallback)` is `parseInt` when positive, else `fallback`.

## Why

sd-server reports a failed job's reason as either a string or a structured
object. `new Error(object)` flattens the latter to the literal "[object Object]",
which then propagates through every layer and masks the real sd.cpp cause (the
exact symptom edit_image was hitting).
