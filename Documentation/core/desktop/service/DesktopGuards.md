# DesktopGuards

`core/desktop/service/DesktopGuards.js`

Desktop control's refusals, checked before any input. Safety-critical: never
loosen one of these.

## Methods

- `new DesktopGuards(win)` over the [Win32](../Win32.md) surface.
- `inputRefusal(w)` text or null: the window's process is protected by anti-cheat
  ([AntiCheatDetector](../AntiCheatDetector.md); automated input there can get the
  user's account banned) or runs elevated (Windows UIPI would silently drop the input).
- `systemPromptOf(hwnd, known?)` `{ kind, label }` or null via
  [SystemPromptDetector](../SystemPromptDetector.md). `known.className` / `known.pid`
  short-cut what `listTopLevelWindows` already read; failing Win32 reads count as unknown.
- `promptRefusal(w)` a `HUMAN_NEEDED` [DesktopError](../DesktopError.md) when `w`
  is a UAC / Windows Security / sign-in prompt, else null.
- `targetRefusal(w)` everything that forbids acting on `w` at all, pattern or real
  input: the prompt refusal first, then the input refusal as `REFUSED`.
- `humanNeeded()` a `HUMAN_NEEDED` error while real input is impossible: the input
  desktop is not `Default` (UAC on the secure desktop, lock screen, Ctrl+Alt+Del;
  null means OpenInputDesktop was denied), or a system prompt owns the foreground.
  A throwing desktop binding is not evidence of a secure desktop and does not block.
  UIA pattern actions on a background window still work, so this gates only real input.
- `checkForeground(w)` throws unless `w` still owns the foreground: `HUMAN_NEEDED`
  when a system prompt took it, a plain error naming the other window otherwise.
  A prompt can appear between two keystrokes; without this the rest of the text
  would be typed into it.
- `preInput(w)` throws `targetRefusal`, then `humanNeeded`.
