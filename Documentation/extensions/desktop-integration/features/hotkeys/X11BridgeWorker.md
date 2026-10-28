# X11BridgeWorker

`extensions/desktop-integration/features/hotkeys/X11BridgeWorker.js`

Entry script of the X11 bridge utilityProcess: an X client beside the native
Wayland app. Loading the file with a parent port starts it, so only
[X11Bridge](X11Bridge.md) forks it.

## Methods

- `X11BridgeWorker.main()`: the parent port (`RamPinMessagePort`, the
  utilityProcess port in the app or child_process IPC under a plain fork),
  [X11Api](X11Api.md)`.load()` (a failure is posted as `error` and exits 1),
  then the poll.
- `new X11BridgeWorker({ api, post, exit, setInterval?, clearInterval? })`;
  `start()` posts `ready` and polls every `POLL_MS` (40 ms).
- `tick()`: one [X11ChordPoller](X11ChordPoller.md) pass over `api.keysDown()`;
  posts `{ type: 'held', vks }` on a change and `{ type: 'fire', id }` per
  completed chord.
- `handle(message)`: `chords` (replace the watched chords; answers
  `{ type: 'chords', unmapped }`), `inject` (keysym names pressed in order,
  released in reverse, XTEST), `release` (key-ups for both sides of the given
  modifiers), `stop`.
