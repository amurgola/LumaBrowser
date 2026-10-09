# UnfulfilledIntent

`core/llm-server/agent/UnfulfilledIntent.js`

Spots a would-be final answer that only announces an action ("Let me check
that.") without doing it. Small local models do this and emit EOS instead of
the tool call.

## Methods

- `UnfulfilledIntent.matches(text)`: true for non-empty text of at most 160
  chars, not ending in a question mark, that contains an intent phrase ("let
  me", "I'll", "I will", "I'm going to", "one moment", "hold on", "checking
  that", ...).
