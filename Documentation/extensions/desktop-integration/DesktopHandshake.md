# DesktopHandshake

`extensions/desktop-integration/DesktopHandshake.js`

`~/.lumabrowser/desktop.json` (override: `LUMA_DESKTOP_HANDSHAKE`), the file
desktop clients read to find Luma: `{ port, token, pid, version, apiBase,
features, writtenAt }`. Modeled on
[CliHandshake](../../core/shell/CliHandshake.md): atomic write (temp file and
rename), mode 0600 where the OS has one, owner-checked removal.

## Methods

- `DesktopHandshake.handshakePath(env?)`, `DesktopHandshake.read(file?)` (null
  when missing or malformed).
- `new DesktopHandshake({ filePath?, version, getToken, getFeatures, now? })`:
  the token and the feature list are read at every write.
- `setPort(port)`: records the gateway port and writes; nothing is written
  before a port is known.
- `refresh()`: rewrites (after a rotation or a feature toggle). False when no
  port yet or the write failed.
- `remove()`: deletes the file only while it still carries the token this
  instance last wrote, so a newer instance's file survives.
- `written`, `filePath`, `port`.
