# FakeBridgeLink

`tools/site-replays/FakeBridgeLink.js`

Base class for scripted stand-ins of the `luma` session's bridge link (`send`, `onFrame`, `onClose`, `close`; see [App](../../cli/lib/tui/session/App.md)), so the real CLI session runs against canned frames with no LumaBrowser. An `EventEmitter`. Implementations: [ScenarioLink](ScenarioLink.md), [CliDemoLink](CliDemoLink.md).

## Methods

- `onFrame(fn)`, `onClose(fn)`, `close()` (no-op), `push(type, payload)` (delivers a frame to the session).
- `send(type, payload)`: abstract; rejects naming the subclass.
- `FakeBridgeLink.sleep(ms)`.
