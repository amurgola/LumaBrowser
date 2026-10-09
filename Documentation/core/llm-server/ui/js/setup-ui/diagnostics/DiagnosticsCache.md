# DiagnosticsCache

`core/llm-server/ui/js/setup-ui/diagnostics/DiagnosticsCache.js`

The renderer-side diagnostics snapshot in localStorage, painted on the first load so the cards never sit on "Loading…" while the probe round-trips.

## Methods

- `read(storage?)`: the payload, or null when absent, unparsable or without `platform`; `write(data, storage?)`. Key `luma.setup.diagSnapshot.v1` (unchanged).

## Globals

Reads and writes `window.localStorage`.
