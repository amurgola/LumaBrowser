# ChatModeTurn

`core/llm-server/chat/router/ChatModeTurn.js`

Resolves a conversation's extension chat mode for one turn.

## Methods

- `new ChatModeTurn({ chatStore, modeRegistry })`.
- `async resolve({ conversationId, messages, modelRef, contextWindow = null, signal = null })` returns `{ descriptor, turn }`: `PLAIN` (both null) for no meta, mode `chat`, an unknown mode, or a throwing `buildTurn`; a descriptor without `buildTurn` gives `{ descriptor, turn: null }`; else `buildTurn({ meta, messages, conversationId, modelRef, contextWindow, signal, capabilities })`.

## Why

A misbehaving mode must never break a turn. The model ref is passed so a mode that spawns its own runs uses this conversation's model; the context window so a mode that trims its own history can size the cut; `signal` (the turn's abort signal, or null) so a mode whose `buildTurn` waits on something (a roleplay waits for the previous reply's bookkeeping) can give the wait up when the user presses Stop.

## Capabilities

`buildTurn` also receives `capabilities` (`ChatModeTurn.CAPABILITIES`, `{ turnPrompt: true }`): what this router does with a turn beyond the original fields. A mode installed apart from the app can be newer or older than the core running it, so it returns `turnPrompt` only when told it will be placed ([ModeTurnMessages](ModeTurnMessages.md)); the roleplay mode otherwise keeps its story state in the system prompt.

`CAPABILITIES.reasoningEffort`: a mode turn's `reasoningEffort` sets the
thinking dial for that turn when the user made no choice of their own.
