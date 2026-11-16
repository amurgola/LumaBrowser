# ShortcutCapture

`extensions/desktop-integration/ui/ShortcutCapture.js`

Turns a `keydown` into the shortcut text the hotkeys feature stores
(`Ctrl+Alt+Shift+D`, `F9`), for the
[DictationShortcutRow](DictationShortcutRow.md). The key comes from
`event.code`, so Shift+1 reads as `1`, not `!`.

Rules:

- A function key (F1 to F24) may stand alone or with any modifiers.
- Any other key (a letter, a digit, Space, Tab, Enter, Backspace, Delete,
  Insert, Home, End, Page Up, Page Down, the arrows, Escape) needs Ctrl, Alt or
  the Windows (Command) key with it. A global shortcut takes its key away from
  every application, so a plain or Shift-only typing key is refused.
- Other keys (punctuation, the numpad, media keys) are refused.

## Methods

- `ShortcutCapture.read(event, { mac? })` -> `{ accelerator }` for a complete
  shortcut, `{ pending }` while only modifiers are down (the ones held so far,
  joined with `+`), or `{ error }` with a sentence for the user. Modifiers are
  written in the order Ctrl, Super (Command on a Mac), Alt, Shift.
- `ShortcutCapture.display(accelerator)`: `Ctrl+Alt+J` -> `Ctrl + Alt + J`.
