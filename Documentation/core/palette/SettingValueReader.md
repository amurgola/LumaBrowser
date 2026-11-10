# SettingValueReader

`core/palette/SettingValueReader.js`

Reads the current value of a palette catalog setting for display: the entry's settings-database `key`, formatted by its spec in [SettingValueSpecs](catalog/SettingValueSpecs.md) through [SettingValueText](SettingValueText.md). [PaletteService](PaletteService.md) builds one over the settings database and hands `valueOf` to the [SettingsProvider](providers/SettingsProvider.md).

## Methods

- `new SettingValueReader({ settingsDb, specs?, runtimeName? })`.
- `valueOf(entry)`: the display text, or null for an entry without a key or spec, or when the store throws (a value never breaks a search).
- `SettingValueReader.runtimeName(id)`: the runtime's name from the LLM runtime catalog (extension runtimes included), else the image runtime catalog, else null. Both are required lazily.

## Globals

None.
