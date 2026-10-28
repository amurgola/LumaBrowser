# DesktopService

`core/desktop/DesktopService.js`

Desktop control on Windows: see and act on other applications' windows. The
pattern every strong desktop agent converged on (Microsoft UFO2, Cua,
Windows-MCP): the accessibility tree first, vision second. The `desktop_*` MCP
tools ([DesktopMcpTools](DesktopMcpTools.md)) and game mode
([GameController](../games/GameController.md), [GameService](../games/GameService.md)) call it.
hwnd 0 stands for the whole desktop (taskbar, Start menu, anything unlisted), and
`launch` opens apps.

## Actions

- `observe`: UI Automation digest of a window's interactive elements as numbered
  refs ([WindowObserver](service/WindowObserver.md)); Chromium and Electron
  windows get their web accessibility woken first.
- `click` ([DesktopClickLadder](service/DesktopClickLadder.md)): ref through a
  UIA pattern (background, no focus, no cursor), else a real click at its centre
  after a hit test ([PointerClicker](service/PointerClicker.md)); x/y from the
  last screenshot; a description found by visual grounding ([VisionLocator](service/VisionLocator.md)).
  Given a ref and a description, a ref that fails falls back to the description.
- `type` ([DesktopTyping](service/DesktopTyping.md)): ValuePattern on a ref, or
  Unicode keystrokes, or a clipboard paste for long and IME-hostile text.
- `drag` ([DesktopDrag](service/DesktopDrag.md)), `scroll` ([DesktopScroll](service/DesktopScroll.md),
  also over a description), `pressKey` (a combo through [DesktopKeyboard](service/DesktopKeyboard.md);
  when the combo itself opened a window, such as win+r opening Run, the reply carries
  `nowInFront: { hwnd, title }`), `setValue` (RangeValue / Value pattern by ref,
  background only), `focus`.
- `launch` (`{ app, args? }`): opens a program name, path, file, folder or URL
  through the shell ([Win32Shell](win32/Win32Shell.md), never a command shell),
  then polls every 250 ms for up to 10 s for windows that were not there before.
  `{ app, windows }`, or `windows: []` with a note to call `desktop_list_windows`.
  `app` is required; app plus args must be one line of at most 1024 characters.
- `lookAfter(args, r)` (async): the window as it looks after an action, so acting
  and looking take one step. Waits `LOOK_SETTLE_MS` (800) for the change to start
  painting, then screenshots the window acted on, or `r.data.nowInFront` when a key
  combo brought up another window. Null when the action failed or `look` is false.

## Guard rails (checked before any input; never loosen one)

- off unless the user enabled it (`core.desktop.enabled`);
- never LumaBrowser's own windows (it has browser tools);
- never an elevated process (Windows would drop the input) or a game protected by
  anti-cheat (synthetic input is treated as cheating);
- never a UAC / Windows Security / sign-in prompt, and no real input at all while
  the secure desktop is up: those fail with code `HUMAN_NEEDED` so the agent asks
  the user instead of retrying;
- every SendInput batch re-checks that the target still owns the foreground
  (code `FOREGROUND_CHANGED` when it does not); the target's own popup in front (a
  browser's "Restore pages" bubble) is not a steal, and the `click`, `type`,
  `pressKey`, `scroll` and `drag` results then carry `popupInFront: { hwnd, title }`
  so the model may close it;
- the whole desktop (hwnd 0) has no window of its own, so every send re-vets the
  window the input would land in (under the pointer for mouse input, in front for
  keys) with the same refusals, and never LumaBrowser itself.

All of them live in [DesktopGuards](service/DesktopGuards.md) and
[GuardedInput](service/GuardedInput.md).

## Methods

- `new DesktopService({ db, nativeImage, visualGrounding?, uia?, win = Win32, clipboard?, sleep?, now? })`.
  `uia`, `win`, `sleep` and `now` are injectable for tests; without `clipboard` typing is keystrokes only.
- `control` ([DesktopRunControl](service/DesktopRunControl.md)): the user's
  Pause and Stop. Every acting call (`click`, `type`, `pressKey`, `scroll`,
  `drag`, `setValue`, `focus`, `launch`) waits out a pause first and returns
  `{ success: false, code: 'STOPPED' }` once stopped; [GuardedInput](service/GuardedInput.md)
  fails the batch in flight the same way.
- `observedNode(hwnd, ref)`: the node a ref named in the last `desktop_observe`
  of that window (role, name, `password`, ...), or null for another window or
  an unknown ref. [DesktopCallRisk](../llm-server/chat/approval/DesktopCallRisk.md) reads it.
- `activity` ([DesktopActivity](service/DesktopActivity.md)): one `start` and
  one `end` event per acting call, naming the action, the window and the
  arguments, for the desktop-integration extension's ring and island.
- `supported` (getter, Windows only), `isEnabled()`, `setEnabled(on)`, `uia()`
  (the [UiaHost](uia/UiaHost.md), started lazily), `shutdown()`.
- Agent actions, each `{ success, data }` or `{ success: false, error, code? }`, never throwing:
  `listWindows()` (`{ windows: [{ hwnd, title, app, rect, minimized, dialog?, elevated?, antiCheat?, systemPrompt? }], humanNeeded? }`;
  owned dialogs such as Run or Save As are included with `dialog: true` and resolve by hwnd or title),
  `focus(args)` (async, like the other acting calls), `screenshot(args)` (`{ screenshot, mimeType, frame, method, title }`; the
  frame maps image pixels back for x/y), `observe(args)` (`{ text, count }`),
  `click`, `type`, `pressKey`, `scroll`, `drag`, `setValue`, `launch(args)`, `lookAfter(args, r)`. `args` names the window
  by `hwnd` or `window` (title substring, must match one window). `screenshot`,
  `click`, `type`, `pressKey` and `scroll` also take hwnd 0 (the whole desktop).
- The contract game mode uses (public by design):
  - `gate()` the reason desktop control is unavailable, or null.
  - `resolve(args, { allowDesktop = false })` `{ w }` or `{ error }`. With
    `allowDesktop`, hwnd 0 resolves to the desktop target (`{ hwnd: 0, title: 'the desktop',
    desktop: true, rect: virtualScreen() }`); without it (game mode, window-only
    actions) hwnd 0 is an error.
  - `inputRefusal(w)` the anti-cheat / elevated refusal text, or null.
  - `bringToFront(w)` resolves false when Windows refused; otherwise waits 150 ms
    after a real focus change (20 ms when already in front), because Chromium apps
    route the first keystrokes to the old focus target (ctrl+b lost at 40 ms, delivered at 150 ms).
    The desktop target resolves true without focusing anything. When focusing fails
    but one of the target's own popups is in front (`checkForeground` returns it),
    that counts as in front and is recorded on `w.popupInFront`.
  - `send(w, inputs)` the guarded SendInput; throws when the foreground moved.
  - `capture(w)` `{ rect, shot, method }`: `window` (PrintWindow), `screen-region`
    when that comes back blank (exclusive fullscreen, protected video), or `screen`
    for the whole virtual screen when `w` is null or the desktop target. A minimized window throws.
  - `win` the [Win32](Win32.md) surface.
- Statics: `ENABLED_KEY`, `MAX_EDGE` (1600, long edge of a screenshot), `HUMAN_NEEDED`,
  `COVERED`, `FOCUS_SETTLE_MS`, `ALREADY_FRONT_SETTLE_MS`, `LAUNCH_WAIT_MS` (10000),
  `LAUNCH_POLL_MS` (250), `LAUNCH_MAX_CHARS` (1024), `LOOK_SETTLE_MS` (800), `DESKTOP_HWND` (0).

## Coordinates

Everything internal is physical screen pixels. Screenshots handed to a model are
downscaled to at most `MAX_EDGE` on the long side ([ScreenshotImage](service/ScreenshotImage.md));
the frame recorded per window ([ScreenFrames](service/ScreenFrames.md)) maps an image point back.
