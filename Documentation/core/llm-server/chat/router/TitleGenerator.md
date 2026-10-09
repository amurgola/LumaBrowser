# TitleGenerator

`core/llm-server/chat/router/TitleGenerator.js`

Asks a conversation's model for a short title after its first exchange and renames the conversation.

## Methods

- `new TitleGenerator({ chatStore, models, dispatch })`.
- `generate(conversationId)` resolves `{ success: true, title }` or `{ success: false }`. Skipped when the conversation is missing, has no user message, has no model (`conv.modelRef`, else the list default), or is a mode conversation already named by its mode (not "New chat"). The prompt quotes the first user and assistant messages (600 characters each); thinking is off (`ThinkingOff.resolve`, always), temperature 0.3, 30 s timeout, trace `{ conversationId, callType: 'title' }`. The reply is cleaned with `ConversationTitle.clean`; any failure keeps the old title.

## Why

Housekeeping must never burn 30 seconds of reasoning or block the chat.
