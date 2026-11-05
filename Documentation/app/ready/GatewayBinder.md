# GatewayBinder

`app/ready/GatewayBinder.js`

Binds the REST gateway to its configured port and keeps trying when the bind
fails. The port is never swapped for a free one: the CLI handshake, exported MCP
configs, Network Sharing and user scripts are all pointed at the configured
port, so a silent move would only relocate the failure. Used by
[HeavyServices](HeavyServices.md).

## Methods

- `new GatewayBinder({ gateway, onListening, onFirstFailure?, log?, setTimeoutFn?, clearTimeoutFn? })`:
  `gateway.start()` must reject on a bind error ([RestGateway](../../core/shell/RestGateway.md)).
- `start()`: resolves after the first attempt, bound or scheduled for retry;
  never rejects. On a bind, `onListening()` runs once (a throw is logged as
  `REST server post-start work failed:`). On the first failure only, the error
  is logged as `Failed to start REST server:` and `onFirstFailure(err)` runs
  (its promise is detached and its rejection swallowed).
- `stop()`: cancels the pending retry; no later attempt runs.
- Fields: `attempts`, `listening`, `lastError`.

## Schedule

`FAST_RETRY_MS` (2 s) for the first `FAST_RETRIES` (30) retries, then
`SLOW_RETRY_MS` (30 s) forever. The fast phase covers a port in TIME_WAIT or a
previous LumaBrowser still shutting down; the slow phase catches a program that
releases the port later. Retry timers are `unref`'d so a pending retry never
holds the process open on quit.
