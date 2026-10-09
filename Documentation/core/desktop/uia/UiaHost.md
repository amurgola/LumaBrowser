# UiaHost

`core/desktop/uia/UiaHost.js`

Node side of the UI Automation sidecar: one long-lived `powershell.exe` running
[UiaHostScript](UiaHostScript.md) over stdin/stdout JSON lines (protocol in that doc).

## Methods

- `new UiaHost({ spawnImpl = child_process.spawn, timeoutMs = 15000 })`.
- `request(payload, { timeoutMs })` sends one request and resolves the reply
  with the same `id`. Requests are serialized so replies cannot interleave.
- `tree(hwnd, { maxNodes = 300 })` `{ nodes, truncated }`; nodes always an array.
- `act(ref, action = 'click', value)` on a ref from the last `tree()`:
  `click` (a pattern, else `{ needsPointer, rect }` after scrolling it into view),
  `setValue`, `setRange` (RangeValue, else Value), `focus`, `locate`.
- `wake(hwnd)` `{ widgets, msaa }`; turns on a Chromium/Electron window's
  web-content tree. 5 s timeout.
- `hit(x, y, ref?)` the element under a physical screen point, and with `ref`
  its relation to that element (`self | descendant | ancestor | other`).
  `ref` is sent only when given. 3 s timeout (it sits in front of a click).
- `close()` kills the sidecar.

A reply with `ok: false` throws its `error`, or `UI Automation <tree|action|wake|hit test> failed`.

## Lifecycle

- Spawned lazily on first request (about 1 s), hidden, with the script as
  `-EncodedCommand` (UTF-16LE base64), so nothing is unpacked from the asar.
  The sidecar's `{ id: 0 }` message means ready; 20 s without it fails the start,
  and a failed start is not cached.
- A request that overruns its timeout is presumed wedged: the host is killed and
  the next request starts a fresh one.
- An exit rejects the pending request with `UI Automation host exited (<code>)`
  plus the last stderr, and the next request restarts the host.

Kept behind this small interface so a faster native backend could replace it
without touching DesktopService.

Fixed: a host recycled after a timeout could emit `exit` after its replacement
had started, and that late exit rejected the new host's requests and dropped its
handle. A stale exit is now ignored (test: `a timed-out request recycles the host...`).
