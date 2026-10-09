# SetupContext

`core/llm-server/ui/js/setup-ui/SetupContext.js`

What the LLM Setup cards share: the preload API, the document and window, the caches every card reads and the cards themselves, so one card can repaint another.

## Methods

- `new SetupContext({ api, doc?, win? })`.
- Fields: `api`, `doc`, `win`; `runtimes` ([RuntimeStatusStore](runtimes/RuntimeStatusStore.md)), `hostCaps` ([HostCaps](diagnostics/HostCaps.md)), `ctxFit` ([CtxFitStore](models/CtxFitStore.md)), `library` ([ModelLibrary](models/ModelLibrary.md)), `lastDefaults` (the last `getDefaults()` snapshot), `cards` (`runtimes`, `runtimeActions`, `models`, `defaults`, `fitTest`, `gambit`, `plan`, filled by [SetupMain](SetupMain.md)) and `refreshLibrary(opts)` ([LibraryRefresher](LibraryRefresher.md)`.request`).

## Globals

None.
