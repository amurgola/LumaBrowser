# Win32Input

`core/desktop/win32/Win32Input.js`

Builds SendInput `INPUT` records (40 bytes, the x64 layout) and sends them.

## Methods

- `Win32Input.mouseInput(flags, mouseData = 0)` a MOUSEINPUT (button or wheel).
- `Win32Input.keyInput({ vk = 0, scan = 0, flags = 0 })` a KEYBDINPUT.
- `Win32Input.keyInputScan({ scan, up = false, extended = false })` scan code only
  (wVk 0, `KEYEVENTF_SCANCODE`): what DirectInput / Raw Input games read. The
  extended flag tells arrows apart from the numpad keys sharing their codes.
- `Win32Input.relativeMoveInput(dx, dy)` `MOUSEEVENTF_MOVE` without ABSOLUTE:
  the raw delta mouse-look games read (SetCursorPos produces none). Rounds.
- `Win32Input.sendInputs(inputs)` sends them as one buffer; returns the count.
  Throws `SendInput delivered <n>/<m> events (blocked by UIPI or the secure desktop)`
  when fewer arrive: an elevated target, the secure desktop, or another app's
  low-level hook. Empty input sends nothing and returns 0.
- `Win32Input.altTap()` an Alt down and up (used to unlock SetForegroundWindow).
- Constants: `INPUT_SIZE` 40, `MOUSEEVENTF`, `KEYEVENTF`, `KEYEVENTF_SCANCODE` 8, `MOUSEEVENTF_MOVE` 1.
