# FitRunSignals

`core/llm-server/server/fit-test/FitRunSignals.js`

The fit test's caller hooks, made safe.

## Methods

- `new FitRunSignals({ onProgress, shouldCancel })`.
- `cancelled()` `shouldCancel()` as a boolean; a missing or throwing hook counts
  as not cancelled. Bound, so it can be handed around as a function.
- `emit(message)` calls `onProgress(message)`; a throw is swallowed.

## Why

The renderer can go away mid-test; neither hook may break a run that is
loading multi-gigabyte models.
