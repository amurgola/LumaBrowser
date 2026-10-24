# AskSettings

`extensions/desktop-integration/features/ask/AskSettings.js`

The [ask feature](index.md)'s settings: `SCHEMA` is the feature's exported
`settingsSchema` (rendered by the Desktop Integration settings tab, see
[FeatureSettingsSchema](../../FeatureSettingsSchema.md)), and an instance reads
the stored values typed and safe.

- `new AskSettings(store)`: `store` is the feature's FeatureSettings (or null
  for defaults only).
- `get(key)`: the stored value or the schema default, through `normalize`; a
  store that throws gives the default.
- `all()`: every key.
- `static normalize(key, value)`: `defaultPrompt` trimmed (empty means the
  default), `defaultMode` one of `both|text|screenshot`, `autoSend` and
  `notifyOnError` booleans (`'true'`/`'false'` accepted), `maxTextChars`
  clamped to 500..200000, `hotkey` trimmed.
- `static defaultOf(key)`, `DEFAULT_PROMPT` (`Help me with what is in this window.`).
