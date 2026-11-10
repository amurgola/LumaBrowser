# SettingValueText

`core/palette/SettingValueText.js`

Turns a stored setting value into the few words the search palette shows beside the setting, following the entry's spec in [SettingValueSpecs](catalog/SettingValueSpecs.md).

## Methods

- `SettingValueText.text(spec, raw, names?)`: an unset value (`null`, `undefined`, `''`) shows `spec.unsetText` when given, else formats `spec.default`; no default shows nothing (`null`). `names.runtime(id)` resolves runtime names. Output is clipped to `MAX` (32) characters.
- `FORMATS`: `onoff` ("On"/"Off", `invert` for opt-out keys), `labels` (the Setup control's own wording, the raw value when unknown), `count`, `tokens` ("64k", "1M"), `gib` ("1 GB"), `duration` ("15 min", "2 h", "Off" for 0), `file` (file name without folders or the model extension), `path` (last two folders), `runtime`, `text`.
- `tokens(n)`, `duration(ms)`, `fileName(p)`, `pathTail(p)`, `clip(s)`, `truthy(v)`.

## Globals

None.
