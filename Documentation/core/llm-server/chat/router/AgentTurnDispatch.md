# AgentTurnDispatch

`core/llm-server/chat/router/AgentTurnDispatch.js`

Routes a Tools-on chat turn through the agent bridge.

## Methods

- `new AgentTurnDispatch({ agentBridge, chatStore, getAgentDeps, policy, contextWindow })`.
- `run({ modelRef, messages, temperature, convId, asstId, hooks, modeTurn, images, llmExtra, choicesOn, voiceOn, docsGrant, evalOverrides, approvalOverride })` returns `agentBridge.run(...)`'s handle. Options sent: `priorMessages` (persisted rows minus the placeholder), `allowTakeover: !evalOverrides`, `modeSystemPrompt` (mode prompt, the documentation note when there is a [DocsSourceGrant](DocsSourceGrant.md), `WIDGETS` when there is no mode and no voice, `CHOICES`, `VOICE` joined by blank lines, or null), `turnReminder` (`VOICE_REMINDER` on voice turns, else null), `images`, `allowedTools` and `refreshAllowedTools` (an eval task list or a mode pin, with no refresh; else the policy, refreshable; a restricted list admits `search_lumabrowser_docs` when there is a grant, on refresh too), `extraTools` (the mode's session tools, then the grant's documentation search tool; null when there are none), `noBrowser`, `pinnedTabId` (`workTabId`, 0 included), `agentBudget` (the mode's, widened by an eval `parallel > 1`), `kbScope`, `ctxPerSlot`, `llmExtra`, `nativeHistory`, `nativeToolsOverride` (`'off'` only), `systemPromptOverride` (undefined outside an eval), `promptExperiments`, `approvalOverride`.
- `static requireDeps(getAgentDeps)`: the deps, or throws `NOT_READY` while `browserService` or `artifactStore` is missing.

## Why

The wire history is stripped to role and content, so an edit_image follow-up needs the persisted rows to find artifact ids. Only the user's policy may be refreshed mid-run; a mode's pin and an eval's task list are exact.
