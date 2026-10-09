# WatcherInput

`extensions/network-watcher/WatcherInput.js`

Request-shape checks shared by the REST routes (`routes.js`) and
[WatcherMcpTools](WatcherMcpTools.md), so both refuse the same inputs with the
same words. Field rules (urlPattern is a string, `sendTo` is http/https, a
pattern+method pair is unique) stay in the core
[NetworkWatcher](../../core/network-watcher/NetworkWatcher.md) model and
[NetworkWatcherService](../../core/network-watcher/NetworkWatcherService.md).

Each method returns the refusal message, or `null` when the input is fine.

## Methods (static)

- `missingField(body, field)`: `Missing required field: <field> is required`
  when `body` is absent or `body[field]` is falsy (the legacy `!req.body.x` test).
- `idError(id)`: `Missing required field: id is required` unless `id` is a
  non-blank string.
- `enabledError(enabled)`: `enabled field must be a boolean` unless it is one.
- `ENABLED_NOT_BOOLEAN`: that message.
