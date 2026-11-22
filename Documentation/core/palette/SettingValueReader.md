# SettingValueReader

`core/palette/SettingValueReader.js`

Reads the current value of a palette catalog setting for display: the entry's settings-database `key`, formatted by its spec in [SettingValueSpecs](catalog/SettingValueSpecs.md) through [SettingValueText](SettingValueText.md). [PaletteService](PaletteService.md) builds one over the settings database and hands `valueOf` to the [SettingsProvider](providers/SettingsProvider.md).

## Methods

- `new SettingValueReader({ settingsDb, getLlm?, specs?, runtimeName? })`. `getLlm()` returns the
  LLMServerService or null; by default the published `global.__lumaLlmServerService`.
- `valueOf(entry)`: the display text, or null for an entry without a key or spec, or when the store throws (a value never breaks a search).
  An entry with a `defaultsField` (a framework option, see [LlmSettingsCatalog](catalog/LlmSettingsCatalog.md))
  reads `getLlm().getDefaults()[defaultsField]`, the serving framework's value over the global one; without the
  service it reads its `key` like any other entry.
- `SettingValueReader.runtimeName(id)`: the runtime's name from the LLM runtime catalog (extension runtimes included), else the image runtime catalog, else null. Both are required lazily.

## Globals

Reads `global.__lumaLlmServerService` (published by ModelServers) when no `getLlm` is given.
