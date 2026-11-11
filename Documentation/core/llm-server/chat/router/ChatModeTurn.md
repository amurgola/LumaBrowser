# ChatModeTurn

`core/llm-server/chat/router/ChatModeTurn.js`

Resolves a conversation's extension chat mode for one turn.

## Methods

- `new ChatModeTurn({ chatStore, modeRegistry })`.
- `async resolve({ conversationId, messages, modelRef, contextWindow = null })` returns `{ descriptor, turn }`: `PLAIN` (both null) for no meta, mode `chat`, an unknown mode, or a throwing `buildTurn`; a descriptor without `buildTurn` gives `{ descriptor, turn: null }`; else `buildTurn({ meta, messages, conversationId, modelRef, contextWindow })`.

## Why

A misbehaving mode must never break a turn. The model ref is passed so a mode that spawns its own runs uses this conversation's model; the context window so a mode that trims its own history can size the cut.

## Capabilities

`buildTurn` also receives `capabilities` (`ChatModeTurn.CAPABILITIES`, `{ turnPrompt: true }`): what this router does with a turn beyond the original fields. A mode installed apart from the app can be newer or older than the core running it, so it returns `turnPrompt` only when told it will be placed ([ModeTurnMessages](ModeTurnMessages.md)); the roleplay mode otherwise keeps its story state in the system prompt.
