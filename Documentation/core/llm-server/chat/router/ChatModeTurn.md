# ChatModeTurn

`core/llm-server/chat/router/ChatModeTurn.js`

Resolves a conversation's extension chat mode for one turn.

## Methods

- `new ChatModeTurn({ chatStore, modeRegistry })`.
- `async resolve({ conversationId, messages, modelRef })` returns `{ descriptor, turn }`: `PLAIN` (both null) for no meta, mode `chat`, an unknown mode, or a throwing `buildTurn`; a descriptor without `buildTurn` gives `{ descriptor, turn: null }`; else `buildTurn({ meta, messages, conversationId, modelRef })`.

## Why

A misbehaving mode must never break a turn. The model ref is passed so a mode that spawns its own runs uses this conversation's model.
