# ChatTurn

`core/llm-server/chat/router/ChatTurn.js`

One chat turn, built fresh for every `chat()` call.

## Methods

- `new ChatTurn(deps)`; deps: `{ chatStore, conversation, attachments, modes, reaction, contextWindow, compaction, thinking, agentDispatch, dispatcher, inFlight, reclaimer, getDocs }` (`getDocs`: lazy `() => DocsKnowledgeBase | null`).
- `async run(args)`; args: `{ conversationId, modelRef, messages, userMessage, temperature, agent, regenerateMessageId, editMessageId, attachments, disabledTools, choicesEnabled, noThink, reasoningEffort, voice, docsSource, send, evalOverrides, approvalOverride }`. `docsSource` (boolean) is the "@lumabrowser-documentation" pill: when true and the index is on this build, the turn gets a [DocsSourceGrant](DocsSourceGrant.md). Returns `{ success: true, conversationId, assistantMessageId }` once dispatched, or `{ success: false, error, ...hints, conversationId?, assistantMessageId? }`. Steps: validate (`messages is required`, `modelRef is required`); abort the in-flight turn without marking the server dirty and cancel a pending reclaim; open the conversation; sync Tools and choices, remember the docs pill (`rememberDocsSource`), add the user row (an edit's row is a variant of the original prompt), persist image artifacts, remember the model; apply the mode (force agentic, temperature when unset, model pin, plain-path system prompt); add the placeholder (a regeneration variant under the original turn's parent, else continuing the thread); send `meta { conversationId, assistantMessageId, userMessageId, userArtifacts }`; compact; fold `WIDGETS` (plain chat, not voice) / `CHOICES` / `VOICE` into the plain path's system head; on the plain path with a docs grant, fold the documentation passages matching the user's message in too (`prepass`; a failure leaves the messages alone); resolve the thinking dial; dispatch through `AgentTurnDispatch` (handing it `docsGrant`) or the dispatcher (trace `{ conversationId, turnId, callType: 'chat' }`); register the in-flight turn unless it already ended.

## Why

The supersede keeps the warm server and its KV cache: a healthy llama-server frees its slot on disconnect, and a wedged slot is the explicit Stop's job. Per-turn state lives on a per-turn object, since a second turn can start while the first awaits compaction.
