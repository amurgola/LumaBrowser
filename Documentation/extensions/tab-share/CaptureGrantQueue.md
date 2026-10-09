# CaptureGrantQueue

`extensions/tab-share/CaptureGrantQueue.js`

Serialises tab capture grants for the hidden capturer page.
`getDisplayMedia` carries no "which tab" argument, so one tab's frame is
parked at a time.

## Methods

- `new CaptureGrantQueue({ getFrameForTab, toPage, log, timeoutMs = 15000 })`.
- `request(tabId)`: queued behind any grant in flight. With no frame for the
  tab, sends `{ k:'capture-denied', tabId, error:'tab not available' }`.
  Otherwise parks the frame and sends `{ k:'capture-go', tabId }`, then waits
  for `done` or the timeout (logged `capture of tab <id> timed out`).
- `done(tabId, ok, error)`: the page's `capture-done`; clears the parked
  frame; a failure is logged `capture of tab <id> failed: <error>`.
- `takePendingFrame()`: the display-media handler's one-shot read; a second
  request before the next grant gets nothing.
