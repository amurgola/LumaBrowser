# TraceCallsSetting

`core/llm-server/ipc/TraceCallsSetting.js`

The Settings switch for the per-call [LlmTrace](../chat/LlmTrace.md).

## Methods

- `new TraceCallsSetting(db, trace = LlmTrace)`.
- `status()` `LlmTrace.status(db)`.
- `set(value)` stores `value === true` under `LlmTrace.SETTING_KEY` and returns the
  status; throws `Settings database is not available` without a database.
- `clear()` `LlmTrace.wipeAll()`, returns `{ cleared: true }`.
