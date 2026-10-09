# ThinkPane

`core/llm-server/ui/js/chat/turns/ThinkPane.js`

The collapsible reasoning pane above a reply. "Thinking right now" is decided by
how recently a reasoning token arrived (1.5 s), not by whether an answer ever
started: agent runs roll prose back into the pane, which made every later burst
read "Thought for" while still thinking.

## Methods

- `isThinkingNow(message)`.
- `ThinkPane.create(text, open, streaming)`, `ThinkPane.update(pane, text, streaming)`,
  `ThinkPane.scrollToEnd(pane)`.
