# ModelTextOverrides

`core/llm-server/service/ModelTextOverrides.js`

Base for the sparse per-model text maps keyed by model file stem. Extends
[SettingsMapStore](SettingsMapStore.md).

## Methods

- `get(key)` the stored text, `''` when absent or not a string.
- `set(key, text)` stores `text.trim()`; blank or non-string text deletes the
  entry; a falsy key changes nothing. Returns the whole map.
- Inherited `all()`.

Subclasses: [LlmModelDisplayNames](LlmModelDisplayNames.md), [ModelLaunchFlags](ModelLaunchFlags.md).
