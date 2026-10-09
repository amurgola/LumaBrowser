# HandshakeFile

`cli/lib/connect/HandshakeFile.js`

Reads the per-launch handshake the running app writes ([CliHandshake](../../../core/shell/CliHandshake.md)):
`{ port, token, pid, version, writtenAt }`.

## Methods (static)

- `HandshakeFile.path(env?)`: `$LUMA_CLI_HANDSHAKE` when set (used as given), else
  `~/.lumabrowser/cli.json`.
- `HandshakeFile.read(file?)`: the body, or `null` when the file is missing, malformed, or lacks an
  integer `port` and a string `token`.
