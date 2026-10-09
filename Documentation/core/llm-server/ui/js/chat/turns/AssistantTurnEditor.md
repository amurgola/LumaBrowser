# AssistantTurnEditor

`core/llm-server/ui/js/chat/turns/AssistantTurnEditor.js`

Inline editing of the newest reply: the bubble (and its action row and chips)
hide behind a textarea holding the raw markdown. Save persists through
`api.conv.updateMessage(id, { content, conversationId })`, patches the message
so the next turn continues from the edit, re-renders and calls the mode's
`onMessageEdited`; a failure keeps the editor with the reason. Ctrl/Cmd+Enter
saves, Escape cancels.

## Methods

- `edit(message, turnEl)`.
