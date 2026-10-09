# AgentRunCards

`core/llm-server/ui/js/chat/turns/AgentRunCards.js`

Sub-agent cards: when a tool delegates to a named agent, its thinking, steps and
answer stream into a collapsible card above the main answer, open while it works
and collapsed when it finishes (unless toggled). Built once and updated in place
so the spinner never restarts.

## Methods

- `AgentRunCards.create(message)`, `AgentRunCards.sync(turnEl, message)`.
