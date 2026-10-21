# ExtensionAddMenu

`core/shell/ui/settings/ExtensionAddMenu.js` (ES module)

The "+" at the end of the Extensions subtab strip: a small menu with New Extension and Install from .zip.

## Methods

- `new ExtensionAddMenu({ host, onNewExtension, onInstallZip })`: `host` is the
  `#extAddMenuHost` span [SettingsTabs](SettingsTabs.md) puts after the subtabs.
- `mount()`: renders `#extAddBtn` (aria-haspopup, aria-expanded) and the hidden
  `#extAddMenu` (role menu) with `#ext-new-btn` and `#ext-install-btn`; a
  choice closes the menu, then runs its callback.
- `open()`, `close()`, `toggle()`, `isOpen()`: while open, a capture-phase
  document click outside the host or Escape closes it; the listeners are
  removed on close.

## Globals

Reads `document` only.
