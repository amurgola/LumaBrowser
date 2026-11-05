# TurnReminder

`core/llm-server/chat/bridge/turn/TurnReminder.js`

The per-iteration restatement of the tool-call protocol.

## Methods (all static)

- `compose({ turnReminder = null, nativeTools = false, offFormat = false,
  parallel = false, now = null })`: `clockLine(now)` first, then the caller's
  reminder, then `CORRECTION` (after drift), `FORMAT_PARALLEL` (pool > 1) or
  `FORMAT`; no format block for native-tool models; null when empty.
- `clockLine(now)`: `Current time (the user's local clock): 01:52 PM EST.` in
  `TIME_FORMAT`; null for anything but a valid Date.
- `appendKeeping(msgs, reminder)`: writes the reminder into the last message
  itself (the agent loop's path): the pre-reminder text is kept under the
  `BASE` symbol so a later reminder on the same message replaces the first;
  non-text content gets its own user message, reused the same way. Returns the
  same array.
- `append(msgs, reminder)`: merged into the last message's text (a new user
  message when it is not a string); non-mutating copy, for callers that must
  not touch the history.
- `FORMAT`, `FORMAT_PARALLEL`, `CORRECTION`, `TIME_FORMAT`.

## Why

By iteration four the system prompt is far behind the generation point. It
rides on the last message because several chat templates raise on a later
system message. The clock rides here for a different reason: a minute ticking
over in the system prompt invalidated the KV cache of the whole conversation
every turn (see [SystemPromptAppend](../prompt/SystemPromptAppend.md)); the
tail is new on every turn anyway, so the minute costs nothing there.

It is kept in the history (`appendKeeping`) rather than copied in and dropped:
a reminder the next iteration no longer sent made the request diverge from
the server's KV cache at that message, so every step re-read the model's own
previous reply. Keeping it costs one reminder per iteration in context and
saves re-reading each reply. One known wrinkle: a carried note that
`CarriedNotesLedger` would strip by `endsWith` now sits before the reminder and
stays; it is a few tokens.
