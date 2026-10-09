# ServiceRequest

`core/shell/shellClassifier/rules/system/ServiceRequest.js`

Reads a service-manager invocation into one shape.

## Methods

- `ServiceRequest.parse(command)`: a frozen `{ label, action, units, effect }` or `null` for non-service calls.
  `effect` is `'halt'` (takes a service away: stop, kill, disable, mask, freeze, pause, delete, remove, unload,
  bootout, configure, cleanup), `'change'` (start, restart, reload, enable, daemon-reload, load, kickstart, create,
  ...), or `null` (inspection).

Readers per manager: `systemctl` (via [SystemctlArgs](SystemctlArgs.md)); SysV `service UNIT ACTION` (or
`ACTION UNIT`); OpenRC `rc-service` and `rc-update add|del`; `launchctl`; `sc [\\server] VERB SERVICE` (`config`
reads as `configure`, a halt, since it can disable); `net start|stop|pause|continue`; the `*-Service` cmdlets
(`-Name`, `-DisplayName`, positionals); `brew services`.
