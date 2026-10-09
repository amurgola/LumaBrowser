# DebugLogsView

`core/llm-server/ipc/DebugLogsView.js`

The chat's dev-only "Copy Logs" source.

## Methods

- `DebugLogsView.read({ argv?, app?, log? })` returns `{ isDev, lines }`. A dev run
  is `--dev` in `argv` (default `process.argv`) or an unpackaged electron `app`;
  only then are the [DebugLog](../../DebugLog.md) lines included.
