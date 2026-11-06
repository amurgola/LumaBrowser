# SettingsProvider

`core/palette/providers/SettingsProvider.js`

Search palette provider for settings: matches the query against the declared
catalogs ([ShellSettingsCatalog](../catalog/ShellSettingsCatalog.md),
[LlmSettingsCatalog](../catalog/LlmSettingsCatalog.md)) plus the entries
[ExtensionEntries](ExtensionEntries.md) derives from the enabled extensions at
search time.

## Methods

- `new SettingsProvider({ catalogs, listExtensions })`.
- `entries()`: the static entries plus the extension ones (none while extensions
  are still loading).
- `byId(id)`, `search(query, { limit = 8 })`.
- `SettingsProvider.item(entry, score, marks)`: a `setting` row whose subtitle is
  the breadcrumb and whose `detail` is the description (Dig deeper feeds it to
  the model).
- `SettingsProvider.breadcrumb(entry)`: the surface (`Settings`, `LLM Setup` or
  `Chat` for Tune) then the path, joined with `›`.

## Why

Field weights are label 1, keywords 0.85, path 0.6, description 0.5, so "context
length" lands on the row while "remember more of the chat" still finds it through
the description. A whole page or section scores 0.9 of a single setting with the
same match, so the precise row wins a tie.
