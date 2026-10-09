# TabInputSink

`extensions/tab-share/TabInputSink.js`

Applies a guest's input to the shared tab as trusted `sendInputEvent` calls,
in order, with the mapper's pauses. It does not decide whether input is
allowed; [TabStreamer](TabStreamer.md) does.

## Methods

- `new TabInputSink({ getWebContents, log, sleep })` (`sleep` injectable).
- `hasLiveTarget()`: a webContents exists and is not destroyed.
- `navigate(action)`: `back` / `forward` only when history allows
  (`webContents.navigationHistory` on Electron 32+, else the legacy methods),
  `reload` always. Errors swallowed.
- `enqueue(events)`: queued behind earlier input; stops if the tab dies
  mid-sequence; a throwing `sendInputEvent` is logged and the rest continue.
- `settled()`: the queue's tail promise.
