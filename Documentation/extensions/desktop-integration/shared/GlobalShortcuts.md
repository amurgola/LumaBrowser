# GlobalShortcuts

`extensions/desktop-integration/shared/GlobalShortcuts.js`

One global-shortcut backend for every desktop feature (`deps.shortcuts`):
Electron's `globalShortcut`, or the [X11 bridge](../features/hotkeys/X11Bridge.md)
while it runs on a Linux Wayland session, where Electron registers nothing
that ever fires. It keeps the `globalShortcut` shape
[HotkeyBindings](../features/hotkeys/HotkeyBindings.md) drives, remembers
every binding, and moves them all to the other backend when the bridge comes
up or goes down, so a feature (agent-run, Lumabyte) registers once and its
keys follow the bridge without knowing it exists. The hotkeys feature drives
the bridge itself (it starts and stops it by its `waylandBridge` setting) and
registers straight on it or on Electron.

## Methods

- `new GlobalShortcuts({ globalShortcut, bridge, log })`: `globalShortcut`
  Electron's or null (plain node); `bridge` an X11Bridge or null; subscribes to
  the bridge's `onStateChange`.
- `backend`: the bridge while `bridge.running`, else Electron; `viaBridge`.
- `register(accelerator, callback)` -> true when the current backend took it,
  false when none is available or it refused (a key the bridge cannot watch,
  an accelerator another program holds: logged). The binding is kept either
  way, so the next backend tries it.
- `unregister(accelerator)`, `unregisterAll()`, `isRegistered(accelerator)`
  (true only while a backend has it).
- `rehome()`: every binding moves to the backend that works now (the bridge
  state listener calls it).
- `dispose()`: unregisters everything and drops the listener.

## Why

The agent-run keys (pause, stop, allow, deny) and Lumabyte's attach key went
through Electron's `globalShortcut` directly, which on native Wayland answers
true and never fires. The hotkeys feature got the bridge first; this gives the
other features the same keys with one object, and keeps the bridge's single
owner.
