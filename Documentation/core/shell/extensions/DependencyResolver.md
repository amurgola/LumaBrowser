# DependencyResolver

`core/shell/extensions/DependencyResolver.js`

Decides which discovered, non-disabled extensions can load and in what order.

## Methods

- `new DependencyResolver({ manifests, disabled, coreServices })`.
- `resolve()` -> `{ order, unmet }`. A required `core:<x>` needs the core
  service present; a required `ext:<id>` must resolve first (`missing` when not
  discovered, `pending` otherwise). A first strict pass also waits for optional
  `ext:` deps that are still loadable, so they activate before the dependent; a
  relaxed pass then ignores optional deps. `unmet` maps each leftover id to the
  dependency key that blocked it. `order` is sorted by [LoadPriority](LoadPriority.md).

## Why

ai-chat once declared an optional helper extension as required while presets
shipped that helper off, so ai-chat and timed-tasks silently never loaded.
Optional deps order but never gate.
