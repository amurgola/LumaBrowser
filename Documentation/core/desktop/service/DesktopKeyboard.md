# DesktopKeyboard

`core/desktop/service/DesktopKeyboard.js`

Keyboard input for desktop control, all through [GuardedInput](GuardedInput.md).

## Methods

- `new DesktopKeyboard({ win, input, sleep })`.
- `combo(w, combo)` presses a combo from [DesktopKeys](../DesktopKeys.md)
  (`ctrl+s`), 15 ms between events. Keys still down when it stops (the foreground
  changed mid-way) are released in reverse, so Ctrl or Alt never stay logically held.
- `typeKeys(w, text)` one KEYEVENTF_UNICODE down/up batch per character (both
  UTF-16 units for astral characters), Enter for `\n`.
- `enter(w)` VK_RETURN down and up.
- `paste(w, text, clipboard)` writes `text`, presses ctrl+v, waits
  `PASTE_RESTORE_MS` (600; the target reads the clipboard while handling the
  keystroke, which can lag behind SendInput), then puts the user's clipboard back
  ([ClipboardSnapshot](ClipboardSnapshot.md)) only if it still holds our text:
  something the user copied meanwhile wins. Resolves whether it restored. The
  restore runs even when the paste was cut short.
