# HotkeysFeature

`extensions/desktop-integration/features/hotkeys/HotkeysFeature.js`

Wires the [hotkeys feature](index.md): reads bindings and options from
`deps.settings`, registers shortcuts through [HotkeyBindings](HotkeyBindings.md),
runs [HotkeyActions](HotkeyActions.md) from a shortcut or REST, and reports.

- `static ACTIONS`: `{ id, label, description, defaultBinding }` per action.
- `static settingsSchema()`: the declarative fields `index.js` exports.
- `static defaultParts()`: the real parts (Electron `globalShortcut`,
  `clipboard`, `BrowserWindow`, `Notification`; the platform's keys backend from
  [SelectionKeys](SelectionKeys.md);
  `ExtensionGlobals.chatRouter()`; [RegionCapture](RegionCapture.md) over
  `core/desktop/Win32` on Windows). Electron is required lazily.
- `constructor(deps, parts)`: parts `{ globalShortcut, bridge?, hintTarget?, clipboard, keys, getRouter, region, notify(title, body), screenText?, sleep?, now? }`
  (`hintTarget` replaces the pointer-based [HintTarget](HintTarget.md): a
  [KWinHintTarget](KWinHintTarget.md) on KDE Wayland, from `defaultParts`;
  its `titleOf` names the framed window in the caption)
  (`screenText` defaults to a [ScreenTextReader](ScreenTextReader.md) over `getRouter`).
- `start()` / `applyBindings()`: (re)registers every binding, logs conflicts.
  `start()` first starts the [X11Bridge](X11Bridge.md) when `parts.bridge`
  exists (a Linux Wayland session with XWayland; `defaultParts(deps)` takes the
  extension's shared `deps.bridge`, the one every feature's shortcuts follow
  through [GlobalShortcuts](../../shared/GlobalShortcuts.md), and asks
  `X11Bridge.forSession` only without one) and the `waylandBridge` setting is on; the bindings
  then go through the bridge instead of Electron's `globalShortcut`, which
  registers nothing on Wayland. The bridge's state changes re-apply the hint;
  `bridgeStatus()` (`{ wanted, running, reason }`, or null) rides in
  `describe()` as `bridge`.
- `fire(id)`: a shortcut press; a repeat within `REPEAT_MS` (400 ms, key
  auto-repeat) is ignored. A window picked on the hint goes along as
  `source.hwnd` / `source.frame`.
- `run(id, source)`: runs the action, broadcasts `hotkeys.action`
  `{ action, via, success, code, error }`, logs failures (not `CANCELED` or
  `BUSY`) and shows them on the activity island, or as a native notification
  when the island is off (and `notifyFailures` is on). A failure the island
  already showed (`shown`) is not repeated. Builds the
  [HotkeyActivity](HotkeyActivity.md) over `deps.overlay`.
- Shortcut hint ([ChordHint](ChordHint.md)): `start()` and a change to
  `shortcutHints` or `overlayIsland` start or stop the poll (Windows, an
  overlay, `keys.heldModifiers`, both settings on). The hint lists the
  registered shortcuts grouped by modifiers with short labels (`HINT_LABELS`;
  "Stop reading" while speaking, "Capture window" with a window picked), each
  with its `HotkeyActions.readiness` note (shown under the island when pointed
  at) and greyed out when it cannot work now (no voice, the AI chat down, an
  empty clipboard, already running). It opens on the foreground window's
  monitor with `HINT_CAPTION` under it. A click on a window while it is up
  ([HintTarget](HintTarget.md), polled through `ChordHint`'s `onPoll`) re-peeks
  framed on that window, captioned "Working on <title>"; the desktop or the
  taskbar goes back to the monitor. Clicking a chip runs the action like its
  shortcut (the island never takes focus, so the selection is intact). `fire()`
  suppresses the hint first. It hosts `deps.hints`
  ([HintContributions](../../shared/HintContributions.md)): other features'
  keys join the groups, a click on one runs its `run` with the hint's window,
  and `dismiss` / `target` let a contributor's own shortcut act like the click.
- `describe()`: the `GET /` payload. `mount(router)`: `GET /`, `POST /run`.
- `onSettingsChanged(key)`: a `binding.*` key re-applies the bindings;
  `waylandBridge` moves every binding to the other backend and starts or
  stops the bridge.
- `dispose()`: unregisters every shortcut, cancels an open region pick, stops
  speech it started; later `run` calls answer `DISABLED`.
- `instance()`: the `{ mount, onSettingsChanged, dispose }` object `create` returns.
- `static statusFor(code)`: the HTTP status for a failure code.

## Where the hint runs, and its introduction

- `hintUnavailableReason()`: null when the shortcut hint can run, else why
  not: no overlay, a backend that cannot read held keys (`keys.heldModifiers`
  missing or `keys.pollsModifiers === false`, whose own
  `hintUnavailableReason` is passed on: Wayland), or the `overlayIsland` or
  `shortcutHints` setting off. `_applyHint()` starts the poll exactly when it
  is null, on Windows, macOS, Linux X11 and Linux Wayland with the bridge up
  alike. `describe()` reports it as
  `hint: { on, reason }`.
- `_introduceHint()`: the first time the hint can run, one notification
  (`INTRO_TITLE`, `introBody(modifiers)`: "Hold Ctrl + Alt + Shift for a
  moment in any app...") tells the user the chord exists; the `hintIntroduced`
  setting (`INTRO_KEY`) remembers it.
