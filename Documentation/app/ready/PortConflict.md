# PortConflict

`app/ready/PortConflict.js`

Explains a port the gateway could not bind: another LumaBrowser already serving
it, or some other program, named where the OS will say. Every probe is
best-effort and bounded; [HeavyServices](HeavyServices.md) runs it once, on the
first failed bind, and stores the answer on `restGateway.conflict`.

## Methods

- `PortConflict.inspect(port, { probe?, owner? })` ->
  `{ kind, owner, health }`:
  - `kind: 'lumabrowser'` when `GET http://127.0.0.1:<port>/api/health` answers
    with `app: 'LumaBrowser'` ([HealthRoutes](../../core/shell/rest-gateway/HealthRoutes.md));
    `health` is that reply and no owner lookup runs;
  - `kind: 'other'` with `owner: 'name (pid)'` when the OS names the listener;
  - `kind: 'unknown'` otherwise (closed port, non-JSON answer, failing lookup).
- `PortConflict.probeHealth(port)`: the parsed health reply or null;
  `PROBE_TIMEOUT_MS` 1.5 s.
- `PortConflict.findOwner(port, { platform?, run? })`: Windows asks PowerShell
  (`Get-NetTCPConnection -LocalPort <port> -State Listen`, then `Get-Process`)
  and reads `name|pid`; elsewhere `lsof -nP -iTCP:<port> -sTCP:LISTEN -Fpc`.
  `OWNER_TIMEOUT_MS` 3 s; a bad port, empty answer or failing command is null.
- `PortConflict.parseOwner(out, platform)`: the pure parse of either format.
