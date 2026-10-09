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
  are logged.
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
