# SettingsGuides

`core/shell/settings/SettingsGuides.js`

Reads the in-app guides the Settings panel shows.

## Methods

- `new SettingsGuides(rootDir)`.
- `pathFor(type)` `<rootDir>/documentation/api-howto.md` for `api`, else
  `<rootDir>/documentation/extensions-guide.md`.
- `read(type)` `{ success: true, content }` or `{ success: false, error: 'Guide file not found' }`.
