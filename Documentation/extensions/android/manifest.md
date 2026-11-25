# manifest

`extensions/android/manifest.js`

The manifest of the Android add-on.

## Fields

- `id` `android`, `name` Android, `version`, `description`.
- `distributable: true`: taken out of `app.asar` and shipped as its own zip (`npm run build:extensions`).
- `dependencies.required`: `core:database` (the stored settings) and `core:browser` (opening a device's tab).
- `dependencies.optional`: `ext:personal-hub`, for sending device notifications to the Hub. Without it the
  add-on works and relays nothing.
- `ui['settings-tab']`: the Android settings tab ([renderer](renderer.md)).
- `main`, `renderer`, `mcpTools` and `routes` name the four entry files beside it.
