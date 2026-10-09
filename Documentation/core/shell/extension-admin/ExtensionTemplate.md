# ExtensionTemplate

`core/shell/extension-admin/ExtensionTemplate.js`

Scaffolds a new extension from the name the user typed in the Extensions tab.

## Methods

- `new ExtensionTemplate({ rootDir })`.
- `create(extName)` makes `<rootDir>/extensions/<Slug.from(name)>` with
  `manifest.js` (id, name, version 1.0.0, a settings tab), `main.js` (activate /
  deactivate skeleton) and `renderer.js` (registers the settings tab, exposed as
  `window.__ext_<id with _>`). `{ success: true, extensionId, dir }`, or
  `{ success: false, error: 'Extension directory "<id>" already exists' }`.
- `ExtensionTemplate.manifest(id, name)`, `main(name)`, `renderer(id, name)` the file texts.
