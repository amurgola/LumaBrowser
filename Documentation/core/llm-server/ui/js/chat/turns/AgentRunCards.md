# AgentRunCards

`core/llm-server/ui/js/chat/turns/AgentRunCards.js`

Sub-agent cards: when a tool delegates to a named agent, its thinking, steps and
answer stream into a collapsible card above the main answer, open while it works
and collapsed when it finishes (unless toggled). Built once and updated in place
so the spinner never restarts; the answer text is written through
[HtmlPatcher](../../dom/HtmlPatcher.md) on every tick, so its settled blocks keep
their nodes and only the changed tail is rebuilt (and finished code fences come
from the [CodeHighlighter](../../markdown/CodeHighlighter.md) cache). A run with a `conversationId` (a delegated
sub-conversation) shows an "Open conversation" link in its header; clicking it
dispatches window `luma-open-conversation` `{ conversationId }` (opened by
[ChatSubscriptions](../ChatSubscriptions.md)) without toggling the card.

## Methods

- `AgentRunCards.create(message)`, `AgentRunCards.sync(turnEl, message)`.
