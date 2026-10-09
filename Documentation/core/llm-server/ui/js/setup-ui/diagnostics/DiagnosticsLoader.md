# DiagnosticsLoader

`core/llm-server/ui/js/setup-ui/diagnostics/DiagnosticsLoader.js`

The Setup load: the cached snapshot first, spinners only on never-painted cards, fresh diagnostics, then runtimes, models, defaults, API security and the launch plan in dependency order.

## Methods

- `load({ force }?)`: `force` (Refresh) re-runs the heavy host probes; otherwise main serves its cached snapshot. Without the preload every card reads "llmDiagAPI not exposed: the preload script failed to load."; a failed request writes its error into every card. Fresh data is cached and updates [HostCaps](HostCaps.md).

## Globals

Reads `document` by id and `window.localStorage`.
