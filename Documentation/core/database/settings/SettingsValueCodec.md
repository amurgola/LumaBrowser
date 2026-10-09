# SettingsValueCodec

`core/database/settings/SettingsValueCodec.js`

Encodes setting values for the `settings.value` TEXT column.

## Methods

- `SettingsValueCodec.encode(value)`: strings verbatim, everything else
  `JSON.stringify`.
- `SettingsValueCodec.decode(text)`: `JSON.parse`, falling back to the raw
  text (via [JsonColumn](../JsonColumn.md)).

## Note

A stored string that happens to be valid JSON (`"42"`, `"true"`) decodes to
that value, not the string. Long-standing behaviour that existing settings
rely on; pinned by a test.
