# ThinkPane

`core/llm-server/ui/js/chat/turns/ThinkPane.js`

The collapsible reasoning pane above a reply. "Thinking right now" is decided by
how recently a reasoning token arrived (1.5 s), not by whether an answer ever
started: agent runs roll prose back into the pane, which made every later burst
read "Thought for" while still thinking.

## Methods

- `isThinkingNow(message)`.
- `ThinkPane.facts(message, thinkingNow, now?)`: the summary's inputs,
  `{ elapsedMs, tokens }`: the clock from the first reasoning token
  (`_reasonStart`, set by [ChatEventRouter](../stream/ChatEventRouter.md)) to
  now while thinking, else to the last one (`_reasonAt`); null for a reloaded
  message, which kept no clock; `tokens` is `message.reasoningTokens` when the
  provider reported a count.
- `ThinkPane.create(text, open, streaming, facts?)`,
  `ThinkPane.update(pane, text, streaming, facts?)`, `ThinkPane.scrollToEnd(pane)`.
