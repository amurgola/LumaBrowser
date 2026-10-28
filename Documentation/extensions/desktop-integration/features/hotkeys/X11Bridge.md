# X11Bridge

`extensions/desktop-integration/features/hotkeys/X11Bridge.js`

The X11 bridge the hotkeys feature uses on a Linux Wayland session: a
utilityProcess ([X11BridgeWorker](X11BridgeWorker.md)) that watches the key
map through XWayland and reports held modifiers and completed chords, so the
app stays a native Wayland client.

## Methods

- `X11Bridge.forSession({ platform, env, ...options })`: a bridge on Linux
  when the session is Wayland (`WAYLAND_DISPLAY` or `XDG_SESSION_TYPE`) and
  XWayland is up (`DISPLAY`); null elsewhere (Electron and XQueryKeymap work
  on X11 themselves). The extension makes one for all its features
  (`deps.bridge`); the hotkeys feature starts and stops it.
- `new X11Bridge({ fork?, env?, log?, setTimeout?, clearTimeout? })`: `fork`
  defaults to the RAM pin launcher (an Electron utilityProcess in the app, a
  child_process fork under tests).
- `start()` / `stop()`; `running` (worker up and ready); `reason` (why not,
  or null); `onStateChange(callback)` -> remove() (ready, exit, gave up; any
  number of listeners: the hotkeys feature and the extension's
  [GlobalShortcuts](../../shared/GlobalShortcuts.md)).
- The `globalShortcut` shape [HotkeyBindings](HotkeyBindings.md) drives:
  `register(accelerator, callback)` (true; throws for a key the bridge cannot
  watch, so the binding's status says so), `unregister`, `unregisterAll`,
  `isRegistered`. Chords are kept here and sent to the worker when it is ready
  and after every restart.
- `heldModifiers()`: the worker's last report, vk codes, empty while down.
- `sendCombo(names)` (`['Control_L', 'c']`, pressed in order and released in
  reverse through XTEST), `releaseKeys(vks)`.
- `static chordOf(accelerator)`: `{ id, modifiers: [vk], keysym }` or null
  ([ChordHint](ChordHint.md)`.split` plus [X11Keysyms](X11Keysyms.md)).
- A worker that exits is restarted after `RESTART_DELAY_MS` up to
  `RESTART_MAX` times, then `reason` is `GAVE_UP`.

## Why

Electron 43 runs as a native Wayland client, where `globalShortcut.register`
answers true and never fires, and no Wayland client may read the keyboard. An
X client beside the app can: XWayland keeps the physical key map current for
modifiers and ordinary keys on KDE Plasma at its default settings (verified
on Plasma 6.8). Polling the chord instead of grabbing it means the focused
app still receives the keys, which triple-modifier chords make harmless.
