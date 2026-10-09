# ModelResultStore

`core/llm-server/service/ModelResultStore.js`

Base for durable per-model run results keyed by model weights path. Extends
[SettingsMapStore](SettingsMapStore.md).

## Methods

- `get(modelPath)` the entry, or null (also for a falsy path).
- `save(modelPath, entry)` replaces that model's entry with `_toRecord(entry)`
  when `_isWorthKeeping(entry)`, and returns it; otherwise (or with no path)
  stores nothing and returns the prior entry or null.
- Inherited `all()`.
- Subclass hooks (throw when missing): `_isWorthKeeping(entry)`, `_toRecord(entry)`.
- `ModelResultStore._ranAt(entry)` `entry.ranAt` or now as an ISO string.

Subclasses: [FitResultStore](FitResultStore.md), [GambitResultStore](GambitResultStore.md).

## Why

Both runs are expensive (minutes to an hour of real model work), so a cancelled
run with nothing in it must never erase a prior good one, and the renderer
hydrates both the same way.
