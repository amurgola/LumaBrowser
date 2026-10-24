# HotkeyBindings

`extensions/desktop-integration/features/hotkeys/HotkeyBindings.js`

Registers the [hotkeys feature](index.md)'s shortcuts with Electron's
`globalShortcut` and remembers per action whether it worked. Only shortcuts it
registered are ever unregistered.

- `constructor({ globalShortcut, onFire(actionId), log? })`.
- `apply({ actionId: accelerator })`: unregisters its previous shortcuts, then
  registers each non-empty binding. -> `status()`.
- `status()`: `{ actionId: { accelerator, registered, error } }`. `error` is
  `Already in use by another program` (register returned false),
  `Also bound to "<other action>"`, `Invalid shortcut: ...`, a normalize error,
  or null.
- `unregisterAll()`, `dispose()`.
- `static normalize(text)`: `ctrl+alt+shift+r` -> `Ctrl+Alt+Shift+R` (Electron
  accelerator syntax: modifiers ordered, `win`/`meta` -> `Super`, common key
  names mapped, `Ctrl++` -> `Ctrl+Plus`). `''` for empty; throws without
  exactly one non-modifier key.
