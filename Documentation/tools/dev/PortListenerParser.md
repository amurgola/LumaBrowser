# PortListenerParser

`tools/dev/PortListenerParser.js`

Picks the PIDs to reap for one port. `fromNetstat` reads `netstat -ano -p tcp` lines of the form
`TCP <local>:<port> <foreign> LISTENING <pid>` and keeps those whose local port is exactly the port (not a
substring: 3000 does not match 30000, and a peer's foreign address never counts). `fromLsof` reads one PID per
line. Both deduplicate and drop PID `0` and `selfPid`.

## Methods

- `static fromNetstat(stdout, port, selfPid = process.pid)`, `static fromLsof(stdout, selfPid = process.pid)`.
- Constants: `NETSTAT_LISTENING`.
