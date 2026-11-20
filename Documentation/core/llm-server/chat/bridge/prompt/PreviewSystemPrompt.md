# PreviewSystemPrompt

`core/llm-server/chat/bridge/prompt/PreviewSystemPrompt.js`

The exact system prompt a fresh Tools-on turn would send, for the Advanced
tab's preview. Never runs the model.

## Methods

- `new PreviewSystemPrompt(router)` (for `modelVisionActive`).
- `build({ deps, modelRef = null, allowedTools = null, modeSystemPrompt = null,
  withImages = 0 })` returns `{ prompt, chars, tokensEstimate, toolCount,
  extTools, segments }`. Throws `agent deps unavailable (browser/extensions not
  ready)` without deps. The append comes from
  [SystemPromptAppend](SystemPromptAppend.md) with no active groups and the
  knowledge-base filter applied; the prompt from
  `AgentRunner#buildSystemPrompt({ tabInfo, defaultTabId: 0, allowedTools,
  systemPromptAppend, systemRole })`. Without a `modeSystemPrompt` the preview is of a plain
  Tools-on chat turn, so it carries the chat assistant's role and `<answering>` block
  ([ChatAssistantText](../../ChatAssistantText.md)), as [AgentTurnDispatch](../../router/AgentTurnDispatch.md)
  sends them; with one, the stock role and the mode prompt.
  `toolCount` is null for an unrestricted list. `segments` are `{ key, label,
  present }` for base, tabState, browserTools, dateTime, toolRegistry,
  artifactTools, liveArtifactTool, imageTools, validateTool, extTools,
  visionHint, userCustom, mode.
- `TAB_INFO`, `CUSTOM_PROMPT_SETTING`.
