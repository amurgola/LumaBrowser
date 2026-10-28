# AgentRunFeature

`extensions/desktop-integration/features/agent-run/AgentRunFeature.js`

Wires the [agent-run feature](index.md): the bindings and options from
`deps.settings`, the global shortcuts ([HotkeyBindings](../hotkeys/HotkeyBindings.md)),
the keys on the shortcut hint (`deps.hints`), the run on the overlay
([RunPresence](RunPresence.md)), approval questions on the island
([ApprovalPresenter](ApprovalPresenter.md)) and REST.

- `static ACTIONS`: `{ id, label, defaultBinding, description }` for `pause`,
  `stop`, `allow`, `deny`.
- `static settingsSchema()`: the declarative fields `index.js` exports.
- `static defaultParts(deps)`: the shortcut backend (`deps.shortcuts`, the
  extension's [GlobalShortcuts](../../shared/GlobalShortcuts.md): Electron, or
  the X11 bridge on Wayland; Electron's own without one), `getDesktop()`
  reading `global.__lumaDesktop`, `getRouter()` reading
  `ExtensionGlobals.chatRouter()`. Electron is required lazily.
- `constructor(deps, parts)`: parts `{ globalShortcut, getDesktop, getRouter, now?, setTimeout?, clearTimeout? }`.
- `start()`: registers the shortcuts, adds the hint provider, `attach()`.
- `attach()`: subscribes `RunPresence` to the desktop service and registers the
  presenter with the router (`addApprovalPresenter`) as soon as each is
  published; retried every `ATTACH_RETRY_MS` (1 s) up to `ATTACH_TRIES` (120)
  because both appear after extensions may activate. -> true when both are attached.
- `fire(id)`: a shortcut press (the hint is dismissed first; a repeat within
  `REPEAT_MS`, 400 ms, is ignored). `run(id, source)`: `pause` (continues when
  paused), `resume`, `stop`, `allow` (`answer('once')`), `deny`
  (`answer('reject')`); broadcasts `action` `{ action, via, success, code }`.
- `pause()`, `resume()`, `stop()` (`control.stop()`, then the router's
  `abort()`, then the island says Stopped), `answer(decision)` (the island's
  approval first, then its takeover (`once` continues, `reject` skips), then
  the router's waiting approval card, then its waiting takeover; `NO_APPROVAL`
  when none).
- `hintEntries()`: Allow and Deny while an approval waits; Done, Skip and Stop
  while a takeover waits; Pause or Continue and Stop while a run is live
  (`presence.live`); nothing otherwise. Each entry carries its registered
  accelerator and a note.
- `presence`, `presenter`, `takeover`: the three displays.
- `describe()`: the `GET /` payload. `mount(router)`: `GET /`, `POST /pause`,
  `/resume`, `/stop`, `/approval`.
- `onSettingsChanged(key)`: a `binding.*` key re-applies the bindings.
- `dispose()`: shortcuts, hint provider, presenter registrations, the progress
  subscription, all three displays.
- `instance()`: the `{ mount, onSettingsChanged, dispose }` object `create` returns.
- `static statusFor(code)`: the HTTP status for a failure code.
- Broadcasts: `run` (the presence snapshot on every change), `approval` and
  `takeover` (`{ pending }`), `action`.
