# ActivateToolsCall

`core/llm-server/chat/bridge/groups/ActivateToolsCall.js`

The `activate_tools` meta-tool: loads lazy groups' manuals on demand.

## Methods (all static)

- `execute(params, groups)`: keys from `groups`, `group` or `tools` (array or
  one value). No keys: `activate_tools needs "groups": an array of group keys.
  Available: ...`. None valid: `activate_tools: none of [...] is a valid group
  key. Available: ...`. Otherwise activates the valid ones (`groups` is a
  [ToolGroupState](ToolGroupState.md)) and returns `{ success: true, activated,
  message }` with their manuals and an `(Ignored unknown group(s): ...)` note.
- `NAME` (`'activate_tools'`).

Never gated by the user's denylist.
