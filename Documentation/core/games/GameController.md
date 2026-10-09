# GameController

`core/games/GameController.js`

The input and frame-watching primitives game mode needs on top of desktop
control. Used by GameService (level 2).

## Why not desktop_press_key / desktop_click

Games are a different input audience:

- Many read DirectInput / Raw Input and look only at hardware scan codes, so
  keys go out as scan codes ([GameKeyEvents](GameKeyEvents.md)).
- Games poll input once per frame; a key down and up within one frame is never
  seen. Every press is held (default 60 ms, 3+ frames at 60 fps).
- Mouse-look reads relative deltas, so camera turns are relative moves spread
  over about 200 ms ([RelativeMovePlan](RelativeMovePlan.md)).
- Menus and card or board UIs are ordinary clicks: those go to DesktopService's ladder.

Every guard rail is DesktopService's own (reused, not copied): the enabled gate,
window resolution, the anti-cheat / elevated refusal, bringing the window to the
front, and the foreground re-check before each SendInput. GameController adds no
way around them. Key-ups are always sent, even when the foreground was stolen,
because a key left down keeps auto-repeating into whatever window took over.

## Methods

- `new GameController({ desktop, sleep?, now? })`; throws `GameController needs a DesktopService`.
- `desktop`, `win` (getters; GameService reads `desktop`).
- `target(args)` `{ w }` or `{ error }`: gate, resolve, refusal.
- `pressKeys({ hwnd|window, keys, holdMs = 60, gapMs = 80, mode = 'scan'|'vk' })`
  `keys` is a key, a combo, a space-separated sequence or an array (max 50).
  All keys are parsed before anything is sent. `{ keys, mode, holdMs }`.
- `holdKey({ key, ms = 500, mode })` one chord held `ms` (max 10000).
- `moveMouseRelative({ dx, dy, durationMs = 200 })` deltas clamped to +-10000;
  `{ dx, dy, chunks, durationMs }`. Needs a non-zero delta.
- `clickUI(args)` -> `desktop.click(args)`.
- `frameHash(args)` `{ hash, method }` via `desktop.capture(w)` and `FrameHash.frameSignature`.
- `diff(a, b)` `FrameHash.hamming`.
- `waitForChange(args)`, `waitForStill(args)` see [GameFrameWatcher](GameFrameWatcher.md).
- `calibrateMouse({ dx = 200, settleMs = 300 })` measures idle frame motion,
  nudges the view right and back, and reports `{ reacts, distance, noise, advice }`;
  reacts when the moved distance beats the idle noise by more than 6 bits.
- Statics: `MOVE_TICK_MS` 10, `MAX_HOLD_MS` 10000.

Failures are `{ success: false, error }`, never throws.

## DesktopService contract

GameController calls these on `desktop`. Legacy called the underscore-private
versions; [DesktopService](../desktop/DesktopService.md) now exposes them publicly:

| Port | Legacy | Returns |
|---|---|---|
| `gate()` | `_gate()` | error string or null |
| `resolve(args)` | `_resolve(args)` | `{ w }` or `{ error }` |
| `inputRefusal(w)` | `_inputRefusal(w)` | error string or null |
| `bringToFront(w)` | `_bringToFront(w)` | Promise of boolean |
| `send(w, inputs)` | `_send(w, inputs)` | throws when the foreground moved |
| `capture(w)` | `_capture(w)` | `{ shot, method }` |
| `click(args)` | `click(args)` | result object |
| `win` | `win` | the [Win32](../desktop/Win32.md) surface |

GameService also uses `gate()`, `resolve()`, `screenshot()` and `win.processImagePath`.
