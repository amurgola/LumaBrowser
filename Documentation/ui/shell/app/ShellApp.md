# ShellApp

`ui/shell/app/ShellApp.js`

Composition root of the main window: builds every shell part with its collaborators, installs them in the legacy order (listener order decides which Escape handler runs first), publishes the window globals, starts the slot manager, BrowserRenderer, the extension renderers and the setup-wizard gate.

## Methods

- `new ShellApp({ SetupWizard, UISlotManager, BrowserRenderer })`; any may be omitted and that part is skipped.
- `start()` runs the whole boot (was `initializeApp`).
- Public fields after start: `store`, `log`, `bounds`, `host`, `popupMenu`, `tabActions`, `settings`, `feedback`, `providers`, `slotManager`, `browserRenderer`, `wizard`, `extensionLoader` and the other parts.

## Globals

Reads `window.browserDataAPI`, `window.modelStatusAPI`, `window.bookmarksAPI`, `window.electronAPI.openDashboard`. Writes the globals listed in [ShellGlobals](ShellGlobals.md).
