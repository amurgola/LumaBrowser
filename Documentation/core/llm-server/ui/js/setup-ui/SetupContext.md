# SetupContext

`core/llm-server/ui/js/setup-ui/SetupContext.js`

What the LLM Setup cards share: the preload API, the document and window, the caches every card reads and the cards themselves, so one card can repaint another.

## Methods

- `new SetupContext({ api, doc?, win? })`.
- Fields: `api`, `doc`, `win`; `runtimes` ([RuntimeStatusStore](runtimes/RuntimeStatusStore.md)), `hostCaps` ([HostCaps](diagnostics/HostCaps.md)), `ctxFit` ([CtxFitStore](models/CtxFitStore.md)), `library` ([ModelLibrary](models/ModelLibrary.md)), `lastDefaults` (the last `getDefaults()` snapshot), `cards` (`runtimes`, `runtimeActions`, `models`, `defaults`, `fitTest`, `plan`, filled by [SetupMain](SetupMain.md)) and `refreshLibrary(opts)` ([LibraryRefresher](LibraryRefresher.md)`.request`).

## Globals

None.

## Changes (2026-11-22, framework refactor)

New fields: `frameworks` ([FrameworkStore](frameworks/FrameworkStore.md)), `prefs` ([DefaultsPrefs](defaults/DefaultsPrefs.md), shared by the Chat defaults and Frameworks cards) and `rows` ([DefaultsRows](defaults/DefaultsRows.md), shared so open help survives both cards' re-renders).
