# SystemPromptAppend

`core/llm-server/chat/bridge/prompt/SystemPromptAppend.js`

Assembles everything a Tools-on turn appends to AgentRunner's base prompt.
Shared by the live run and the preview.

## Methods (all static)

- `build({ allows, extTools, groups = null, visionHint = null,
  modeSystemPrompt = null, activeGroups = null, imagePromptHint = null,
  takeover = false, nativeTools = false, nativeExclude = [], now = new Date() })`:
  joined with blank lines: the date-time doc; the manuals of ACTIVE groups
  (fence examples stripped by `ToolGroups.docWithoutFenceExamples` on a
  native route; the image hint after the images manual); on a native route,
  `ToolSchemas.fenceFallbackDoc` for excluded tools an active group exposes;
  the inactive registry (`ToolGroups.buildInactiveRegistry`); `TAKEOVER_DOC`
  when `takeover`; the vision hint; the mode prompt. `groups` is the run's
  available groups; without it they come from
  [AvailableGroups](../groups/AvailableGroups.md)`.for(allows, extTools)`.
- `dateTimeDoc(now)`: `Current date and time (the user's local system clock):
  ...` in `DATE_FORMAT`.
- `TAKEOVER_DOC`, `DATE_FORMAT`.
