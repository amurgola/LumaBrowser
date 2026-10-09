# SystemPromptPreview

`core/llm-server/chat/router/SystemPromptPreview.js`

The Advanced tab's system prompt preview: the exact Tools-on prompt for the current settings, without running a turn.

## Methods

- `new SystemPromptPreview({ policy, agentBridge, getAgentDeps })`.
- `build({ withImages?, modelRef?, modeSystemPrompt? })`: `{ success: false, error: NOT_READY }` without agent deps; else `{ success: true, ...agentBridge.buildPreviewSystemPrompt({ deps, allowedTools, modelRef, modeSystemPrompt, withImages }) }` with the global allow-list; a bridge failure is `{ success: false, error }`.

## Why

The bridge reuses the live prompt assembly, so the preview matches what the model receives.
