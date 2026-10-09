# CliHandshake

`core/shell/CliHandshake.js`

The per-launch file that tells the `luma` CLI (and the IDE plugins) which port
the running app answers on and which token its WebSocket handlers accept.

## Methods

- `new CliHandshake({ filePath?, version? })` generates a fresh 32-byte hex
  token. Public fields: `filePath`, `version`, `token`, `port`, `written`.
- `verify(candidate)` constant-time compares against this launch's token.
- `write(port)` writes `{ port, token, pid, version, writtenAt }` atomically
  (temp file then rename) with mode 0600. Returns false for a falsy port or a
  failed write; never throws.
- `remove()` deletes the file only if it still carries this instance's token.
- `CliHandshake.read(filePath?)` returns the parsed body, or `null` when the
  file is missing, malformed, or lacks an integer `port` and string `token`.
- `CliHandshake.handshakePath()` returns `$LUMA_CLI_HANDSHAKE` (resolved) when
  set, else `~/.lumabrowser/cli.json`.

## Why

A fresh shell cannot know the gateway port (it is configurable) or a credential
the WebSocket handlers accept (upgrade requests bypass the `/api` security
middleware, so each handler checks its own). Both ride one file in a directory
only this user can read, the same pattern as Chrome's `DevToolsActivePort`. The
token is never persisted elsewhere and dies with the process; a CLI that read a
stale file fails auth and re-reads.

`~/.lumabrowser` is the directory the npm CLI package already owns. The env
override exists for tests and second dev instances. `remove()` checks the token
because a newer instance may have replaced the file.
