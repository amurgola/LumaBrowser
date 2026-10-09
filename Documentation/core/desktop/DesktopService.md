# DesktopService

`core/desktop/DesktopService.js`

Desktop control on Windows: see and act on other applications' windows. The
pattern every strong desktop agent converged on (Microsoft UFO2, Cua,
Windows-MCP): the accessibility tree first, vision second. The `desktop_*` MCP
tools ([DesktopMcpTools](DesktopMcpTools.md)) and game mode
([GameController](../games/GameController.md), [GameService](../games/GameService.md)) call it.

## Actions

- `observe`: UI Automation digest of a window's interactive elements as numbered
  refs ([WindowObserver](service/WindowObserver.md)); Chromium and Electron
  windows get their web accessibility woken first.
- `click` ([DesktopClickLadder](service/DesktopClickLadder.md)): ref through a
  UIA pattern (background, no focus, no cursor), else a real click at its centre
  after a hit test ([PointerClicker](service/PointerClicker.md)); x/y from the
  last screenshot; a description found by visual grounding.
- `type` ([DesktopTyping](service/DesktopTyping.md)): ValuePattern on a ref, or
  Unicode keystrokes, or a clipboard paste for long and IME-hostile text.
- `drag` ([DesktopDrag](service/DesktopDrag.md)), `scroll` ([DesktopScroll](service/DesktopScroll.md)),
  `pressKey` (a combo through [DesktopKeyboard](service/DesktopKeyboard.md)),
  `setValue` (RangeValue / Value pattern by ref, background only), `focus`.

## Guard rails (checked before any input; never loosen one)

- off unless the user enabled it (`core.desktop.enabled`);
- never LumaBrowser's own windows (it has browser tools);
- never an elevated process (Windows would drop the input) or a game protected by
  anti-cheat (synthetic input is treated as cheating);
- never a UAC / Windows Security / sign-in prompt, and no real input at all while
  the secure desktop is up: those fail with code `HUMAN_NEEDED` so the agent asks
  the user instead of retrying;
- every SendInput batch re-checks that the target still owns the foreground.

All of them live in [DesktopGuards](service/DesktopGuards.md) and
[GuardedInput](service/GuardedInput.md).

## Methods

- `new DesktopService({ db, nativeImage, visualGrounding?, uia?, win = Win32, clipboard?, sleep? })`.
  `uia`, `win` and `sleep` are injectable for tests; without `clipboard` typing is keystrokes only.
- `supported` (getter, Windows only), `isEnabled()`, `setEnabled(on)`, `uia()`
  (the [UiaHost](uia/UiaHost.md), started lazily), `shutdown()`.
- Agent actions, each `{ success, data }` or `{ success: false, error, code? }`, never throwing:
  `listWindows()` (`{ windows: [{ hwnd, title, app, rect, minimized, elevated?, antiCheat?, systemPrompt? }], humanNeeded? }`),
  `focus(args)`, `screenshot(args)` (`{ screenshot, mimeType, frame, method, title }`; the
  frame maps image pixels back for x/y), `observe(args)` (`{ text, count }`),
  `click`, `type`, `pressKey`, `scroll`, `drag`, `setValue`. `args` names the window
  by `hwnd` or `window` (title substring, must match one window).
- The contract game mode uses (public by design):
  - `gate()` the reason desktop control is unavailable, or null.
  - `resolve(args)` `{ w }` or `{ error }`.
  - `inputRefusal(w)` the anti-cheat / elevated refusal text, or null.
  - `bringToFront(w)` resolves false when Windows refused; otherwise waits 150 ms
    after a real focus change (20 ms when already in front), because Chromium apps
    route the first keystrokes to the old focus target (ctrl+b lost at 40 ms, delivered at 150 ms).
  - `send(w, inputs)` the guarded SendInput; throws when the foreground moved.
  - `capture(w)` `{ rect, shot, method }`: `window` (PrintWindow), `screen-region`
    when that comes back blank (exclusive fullscreen, protected video), or `screen`
    for the whole virtual screen when `w` is null. A minimized window throws.
  - `win` the [Win32](Win32.md) surface.
- Statics: `ENABLED_KEY`, `MAX_EDGE` (1600, long edge of a screenshot), `HUMAN_NEEDED`,
  `COVERED`, `FOCUS_SETTLE_MS`, `ALREADY_FRONT_SETTLE_MS`.

## Coordinates

Everything internal is physical screen pixels. Screenshots handed to a model are
downscaled to at most `MAX_EDGE` on the long side ([ScreenshotImage](service/ScreenshotImage.md));
the frame recorded per window ([ScreenFrames](service/ScreenFrames.md)) maps an image point back.
