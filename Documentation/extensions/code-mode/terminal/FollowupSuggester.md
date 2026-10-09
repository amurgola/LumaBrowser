# FollowupSuggester

`extensions/code-mode/terminal/FollowupSuggester.js`

After a terminal turn, offers the one most useful next instruction.

## Methods

- `new FollowupSuggester(session)`.
- `suggest()`: with the last user/assistant exchange, a side completion
  (`router.completeStream`, temperature 0.4, 20 s, `noThink`) on the session
  model; its first cleaned line is sent as `suggest { text }` unless the session
  closed, a turn started, or a newer turn superseded it.
- `stop()` aborts a pending suggestion.
- `FollowupSuggester.clean(text)`: first non-blank line without wrapping quotes,
  whitespace or a trailing period, at most 140 chars.
