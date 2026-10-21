# ShellApp

`ui/shell/app/ShellApp.js`

Composition root of a browser window: builds every shell part with its collaborators, installs them in the legacy order (listener order decides which Escape handler runs first), publishes the window globals, starts BrowserRenderer and, in the main window, the slot manager, the extension renderers and the setup-wizard gate. A window a tab was dragged out into ([WindowMode](../window/WindowMode.md) detached) skips those three.

## Methods

- `new ShellApp({ SetupWizard, UISlotManager, BrowserRenderer })`; any may be omitted and that part is skipped.
- `start()` runs the whole boot (was `initializeApp`).
- Public fields after start: `detached`, `store`, `log`, `bounds`, `host`, `popupMenu`, `tabActions`, `settings`, `feedback`, `providers`, `slotManager`, `browserRenderer`, `wizard`, `extensionLoader` and the other parts.

## Globals

Reads `window.browserDataAPI`, `window.modelStatusAPI`, `window.bookmarksAPI`, `window.electronAPI.openDashboard`. Writes the globals listed in [ShellGlobals](ShellGlobals.md).
