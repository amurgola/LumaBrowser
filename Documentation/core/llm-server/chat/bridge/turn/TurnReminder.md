# TurnReminder

`core/llm-server/chat/bridge/turn/TurnReminder.js`

The per-iteration restatement of the tool-call protocol.

## Methods (all static)

- `compose({ turnReminder = null, nativeTools = false, offFormat = false,
  parallel = false })`: the caller's reminder plus `CORRECTION` (after drift),
  `FORMAT_PARALLEL` (pool > 1) or `FORMAT`; no format block for native-tool
  models; null when empty.
- `append(msgs, reminder)`: merged into the last message's text (a new user
  message when it is not a string); non-mutating.
- `FORMAT`, `FORMAT_PARALLEL`, `CORRECTION`.

## Why

By iteration four the system prompt is far behind the generation point. It
rides on the last message because several chat templates raise on a later
system message.
