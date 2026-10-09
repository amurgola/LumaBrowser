# MeasuredFootprintStore

`core/placement/service/MeasuredFootprintStore.js`

The measured upper-maxima from placement test renders, keyed by model key.
Extends [SettingsValueStore](../../database/SettingsValueStore.md).

## Methods

- `new MeasuredFootprintStore(settingsDb)`; `STORAGE_KEY` = `core.placement.measured`.
- `all()` `{ [modelKey]: { kind, modelKey, peakVramBytes, peakRamBytes, vramApprox,
  ranAt, kvBytesPerKToken?, weightsBytes?, measuredContextSize? } }`; a missing,
  corrupt or unreadable value is `{}`.
- `merge(entriesByKey)` merges each entry over the stored one for its key
  (skipping empty keys and entries), writes and returns the whole map. A failing
  write is ignored.

## Why

Measurements live apart from the layout the user edits, so auto-arrange never
loses them. The value is stored as a JSON string, the format existing installs
wrote; a stored object is read too.
