# AskHotkey

`extensions/desktop-integration/features/ask/AskHotkey.js`

The [ask feature](index.md)'s optional global shortcut, registered in Luma
itself with Electron's `globalShortcut`, so it works without any desktop
client: pressing it asks about the window in front (`AskService.askForeground`).
Driven by the `hotkey` setting; re-registered on change, cleared on dispose.

- `new AskHotkey({ globalShortcut, onPress, log })`.
- `set(value) -> { ok, accelerator, error? }`: clears the current shortcut and
  registers `value` (empty clears). Errors: `Not a valid shortcut` (Electron
  rejected it), `Another app already uses this shortcut`, `Global shortcuts are
  not available`. Never throws.
- `clear()`, `current`.
- `static toAccelerator(value)`: `"ctrl + alt + a"` to `Ctrl+Alt+A`; `Win`,
  `Windows`, `Meta`, `Cmd` become `Super`; null when empty.

When Luma holds the shortcut, Windows gives it the foreground right, so the
chat can come to the front.
