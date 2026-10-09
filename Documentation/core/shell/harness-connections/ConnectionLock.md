# ConnectionLock

`core/shell/harness-connections/ConnectionLock.js`

A lock file (`<manifest>.lock`) so two LumaBrowser windows never edit agent
config files at the same time.

## Methods

- `new ConnectionLock(file)`; `hold(work)` runs `work()` holding the lock and
  always releases it.
- Statics: `STALE_MS` (30 s: an older lock is a crashed window's and is taken
  over), `WAIT_MS` (5 s of waiting on a fresh lock), `RETRY_MS`, and `BUSY`
  (`Another LumaBrowser window is changing agent connections. Try again in a moment.`).

## Why

Connect and disconnect read, edit and write several files; interleaving two of
them would lose one window's changes. Split out of `HarnessConnections`.
