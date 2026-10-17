# DesktopGuards

`core/desktop/service/DesktopGuards.js`

Desktop control's refusals, checked before any input. Safety-critical: never
loosen one of these. The whole-desktop target (hwnd 0) has no window of its own,
so every send re-vets the window its input would land in: the one under the
pointer for mouse input, the one in front for keys. LumaBrowser itself is never one.
The target's own popups (a browser's "Restore pages" bubble, a menu) are part of
the target, not a steal.

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
  input: the prompt refusal first, then the input refusal as `REFUSED`. Null for
  the desktop target, which is vetted per point and per send instead.
- `humanNeeded()` a `HUMAN_NEEDED` error while real input is impossible: the input
  desktop is not `Default` (UAC on the secure desktop, lock screen, Ctrl+Alt+Del;
  null means OpenInputDesktop was denied), or a system prompt owns the foreground.
  A throwing desktop binding is not evidence of a secure desktop and does not block.
  UIA pattern actions on a background window still work, so this gates only real input.
- `checkForeground(w)` throws unless `w` still owns the foreground: `HUMAN_NEEDED`
  when a system prompt took it, `FOREGROUND_CHANGED` naming the other window
  otherwise. A prompt can appear between two keystrokes; without this the rest of
  the text would be typed into it. When the window in front is one of `w`'s own
  popups (its root owner is `w`, or it is a tool window of `w`'s process, checked
  with `Win32.popupInfo`) it returns `{ hwnd, title }` of that popup instead and
  input may go on. Another ordinary window of the same app (a second Edge window)
  is still a steal. For the desktop target it runs `checkDesktop`.
- `checkDesktop(w)` throws the `landingRefusal` for the window at `w.point`
  (`Win32.rootWindowAt`, mouse input) or, without a point, the foreground window (keys).
- `landingRefusal(at, where)` `REFUSED` when `at` is LumaBrowser's own process,
  else `targetRefusal` of that window; null when it is fine or unknown (the bare desktop).
- `foregroundWindow()` `{ hwnd, title, className, pid }` of the foreground window, or null.
- `preInput(w)` throws `targetRefusal`, then `humanNeeded`, then for the desktop
  target `checkDesktop`.
