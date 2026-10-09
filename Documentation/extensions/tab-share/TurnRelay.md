# TurnRelay

`extensions/tab-share/TurnRelay.js`

The host's own TURN server (node-turn, UDP), so a guest outside the LAN can
still get WebRTC media once the relay port is reachable (port-forwarded or a
routed VPN). On the LAN, ICE picks the direct host candidate and the relay
goes unused.

## Methods

- `new TurnRelay({ Turn, log, probe })`: `Turn` is node-turn's class (loaded
  through [AppDependencyLoader](AppDependencyLoader.md) when not injected);
  `probe` defaults to [UdpPortProbe](UdpPortProbe.md)`.check`.
- `isSupported()`, `isRunning()`, `getPort()`.
- `start({ port = 3478 })`: stops any running server, then fails with
  `The relay server package is not installed in this build.`, `Relay port must
  be between 1 and 65535.`, the probe's message, or the server's error.
  Otherwise starts with long-term auth, realm `lumabrowser`, re-adds existing
  guests, resolves `{ success: true, port }`. Failures resolve
  `{ success: false, error }` and become the status error.
- `stop()`.
- `issueCredentials(id, { host, port })`: a random `ts-<hex>` user and
  secret for one guest, pushed to a running server; returns
  `{ urls: ['turn:<host>:<port>?transport=udp'], username, credential }`.
- `revoke(id)`: removes that guest's user.
- `getStatus()` -> `{ running, port, error, supported }`.

node-turn log lines are prefixed `turn: `; `ENETUNREACH` / `EHOSTUNREACH`
(relay probing unreachable interfaces) are not logged.
