# SettingsMapStore

`core/llm-server/service/SettingsMapStore.js`

Base for stores that keep one object map (key -> entry) under a single settings
key. Extends [SettingsValueStore](../../database/SettingsValueStore.md).

## Methods

- `all()` a shallow copy of the map; a missing, non-object or array value reads as `{}`.
- Subclasses pass `(settingsDb, STORAGE_KEY)` to the constructor and read and
  write through the inherited `_read()` / `_write(value)`.

Subclasses: [ModelTextOverrides](ModelTextOverrides.md) (and through it
[LlmModelDisplayNames](LlmModelDisplayNames.md), [ModelLaunchFlags](ModelLaunchFlags.md)),
[ModelResultStore](ModelResultStore.md). Each runs `SettingsValueStoreContract`.

## Why

Four LLM stores (fit results, gambit results, display names, launch flags) and
the image service's display names all repeated the same empty-map and shape
check. It lives here because `core/database` is outside this port's area; see
the change request in the porting notes about moving it there.
