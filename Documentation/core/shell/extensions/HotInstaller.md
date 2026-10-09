# HotInstaller

`core/shell/extensions/HotInstaller.js`

Adds one extension directory to the live set at runtime (add-on installer,
`context.code.installAndActivate`).

## Methods

- `new HotInstaller({ ledger, disabled, coreServices, activator, restGateway, disable(id) })`.
- `install(dir)` resolves `{ success, id?, name?, error? }`, never throws:
  1. `No manifest.js found in extension directory`; busts the require cache
     for the whole dir, then loads the manifest (`manifest.js failed to load: ...`).
  2. FATAL validation issues, joined with `; `, refuse; warnings are logged.
  3. `"<id>" is a built-in extension and cannot be overwritten` when a bundled
     extension elsewhere holds the id.
  4. `Requires extension "<id>" to be enabled first` /
     `Requires core service "core:<x>" which is unavailable`.
  5. An active copy is disabled first (the update path), the id leaves the
     disabled set, the manifest is stamped user-installed and activated
     (`activation failed: ...`), routes re-enabled, inserted in load order and
     `core.shell.extensionInstalled` broadcast.
