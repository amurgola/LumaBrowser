# UdpPortProbe

`extensions/tab-share/UdpPortProbe.js`

Checks a UDP port can be bound (bind and close a throwaway socket on
`0.0.0.0`), so the relay settings can show a real error: node-turn reports
bind failures only through its log.

## Methods

- `UdpPortProbe.check(port)` resolves null when free, else the message.
- `UdpPortProbe.describe(err, port)`: `EADDRINUSE` -> `UDP port <p> is already
  in use by another program.`; `EACCES` -> `Permission denied for UDP port <p>.
  Try a port above 1024.`; else `Could not bind UDP port <p>: <message>`.
