# GuestTurnDispatch

`core/llm-server/chat/router/GuestTurnDispatch.js`

Starts an agent turn for a Network Sharing client (the web app or a paired
device) the way [AgentTurnDispatch](AgentTurnDispatch.md) starts the host's own
chat turn, with the guest limits on top. [ProxyTurns](ProxyTurns.md) `agent`
calls it.

## Methods

- `new GuestTurnDispatch({ agentBridge, getAgentDeps, contextWindow })`.
- `run(turn)`: `turn` is `{ modelRef, messages, temperature, hooks, images,
  priorMessages, allowedTools, extra, modeSystemPrompt, kbScope, runId,
  clientConversationId, plan, mediaModels, choicesOn, voiceOn, modelBudget }`.
  Starts `agentBridge.run` with:
  - the chat assistant's role (`ChatAssistantText.ROLE_TOOLS`) and the same
    prompt append as the desktop (`AgentTurnDispatch._promptAppend`: answering
    guidance, widgets, "Suggest replies", voice, the plan note);
  - `nativeHistory: true`, the model's context window (`ctxPerSlot`), the voice
    turn reminder, the chat assistant's request reminder on unfamiliar names
    (`AgentTurnDispatch._requestReminder`; none under a host agent's persona),
    the model's Tune budget (`agentBudget`);
  - `update_plan` (allowed even under a restricted tool list), its step
    reminder and its final-answer check, filed under `clientConversationId`;
  - `conversationMeta`, a [GuestConversationMeta](GuestConversationMeta.md)
    seeded with the client's `plan` and `mediaModels`;
  - the guest limits: the given `allowedTools`, `withholdTools:
    HostOnlyTools.isHostOnly`, `forGuest: true`, `allowTakeover: false`.
  `runId` keys the turn's artifacts on the host. A host agent's persona
  (`modeSystemPrompt`) speaks in its own role and does not plan, as the
  agent-chat mode does on the host; a turn with no `clientConversationId` does
  not plan either. Throws the not-ready error without the browser.
- `GuestTurnDispatch.conversationId(raw)`: a client's conversation id trimmed
  and capped at 120 characters, or null.

## Why

Web turns used to run through a bare bridge call: no chat role, a flattened
transcript history, no answering guidance, no context window and no plan, so
the same request read much worse on the web than in the LLM tab (2026-11-25).
The client owns its chats, so nothing is written to the host's chat store: the
plan and the media picks travel with each request and come back as events.
