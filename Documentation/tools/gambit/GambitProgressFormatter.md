# GambitProgressFormatter

`tools/gambit/GambitProgressFormatter.js`

Turns the polled live snapshot of a test run into the stderr progress lines of `run-gambit`.

## Methods

- `new GambitProgressFormatter()` remembers what it has printed.
- `lines(live)` returns only what is new since the last call: the chat server line when `live.server` changes
  (`loading the model into the chat server…`, `chat server started|failed`); once per suite, when its capabilities
  are known, `suite: N tasks; web reachable|UNREACHABLE (web tasks will skip)`; then one line per new entry of
  `live.outcomes`: `  NN%  group/task` or `  skip  group/task (reason)`. `live` is the
  [TestRunLive](../../extensions/model-testing/session/TestRunLive.md) snapshot, or the finished run's `{ outcomes }`
  to flush the tail; null gives no lines.
