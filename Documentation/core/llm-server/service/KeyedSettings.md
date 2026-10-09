# KeyedSettings

`core/llm-server/service/KeyedSettings.js`

Base for settings groups spread over several plain settings keys.

## Methods

- `new KeyedSettings(settingsDb)`; subclasses read `this._db`.
- `_setOrDelete(key, value)` deletes the key for `null`, else stores the value,
  so a cleared setting reads exactly like a fresh install.

Subclasses: [LlmServerSettings](LlmServerSettings.md), [LlmUiState](LlmUiState.md),
[LlmDefaults](LlmDefaults.md), [NvidiaSmiPathSettings](NvidiaSmiPathSettings.md).
