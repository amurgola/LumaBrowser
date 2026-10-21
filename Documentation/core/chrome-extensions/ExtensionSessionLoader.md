# ExtensionSessionLoader

`core/chrome-extensions/ExtensionSessionLoader.js`

Loads and unloads Chrome extensions across every Electron session, remembering
which ids each session already holds.

## Methods

- `track(sess)` adds a session to the known set.
- `loadIntoDefault(extPath)` loads into `session.defaultSession`, records the id
  and returns Electron's extension object. Rejections propagate (install needs
  them).
- `loadInto(sess, extPath, expectedId)` never throws. Returns `false` when the
  session already holds `expectedId` or the load fails, `true` when newly
  loaded. Failures matching `already loaded` or `ENOENT` are silent; others
  are logged. A call made while the same folder is already loading into that
  session joins the running load and gets its result instead of starting a
  second `loadExtension`.
- `isLoading(sess)` is true while any load runs in the session.
- `settled(sess)` resolves once no load is running in the session. Tab code
  waits on it before checking for a stalled first navigation (see
  [FirstNavigationGuard](FirstNavigationGuard.md)).
- `loadEverywhere(extPath, id, { except })` calls `loadInto` for every live
  session but `except`.
- `unloadEverywhere(id)` removes the extension from every live session and
  forgets the id there.
- `liveSessions()` is the tracked sessions, every live webContents' session and
  the default session.

## Why

The per-session id set (a `WeakMap`, so closed sessions are collected) is what
makes `loadAllEnabled` safe to call on every `session-created` and tab
attach. Forgetting an id on unload is what lets a disabled extension be
enabled again in the same run.

## onTrack

`new ExtensionSessionLoader({ onTrack })`: `onTrack(session)` fires the first
time a session is tracked. ChromeExtensionService uses it to attach the
[ShimBridge](bridge/ShimBridge.md) to any session it did not already know.

## Worker registrations

`new ExtensionSessionLoader({ registrations })` (default a new
[WorkerRegistrations](shim/WorkerRegistrations.md)): `loadInto` awaits
`registrations.prepare(sess, expectedId)` before `loadExtension` and calls
`record` after it succeeds; `loadIntoDefault` records too. The load counts as
running (`isLoading`, `settled`) from the moment `loadInto` is called, so the
extra await does not open a gap for tabs.

## Crash journal marks

Each load writes `ext:load`, then `ext:loaded` or `ext:load-failed`, with the
session (`sessionLabel(sess)`: the partition folder such as `main` or
`main-3`, `default` for the profile root) and the id. `TabLifecycle` writes
`tab:load-held` and `tab:load-released` around a first load it holds. Together
they show in `crash-trace/run-*.log` which load a stalled tab overlapped.
