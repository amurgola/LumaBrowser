# ActivationManual

`core/llm-server/chat/tool-groups/ActivationManual.js`

Data only: the texts that teach the model to load a lazy tool group.

## Members

- `ActivationManual.ACTIVATE`: the always-present `activate_tools` manual
  (also exposed as `ToolGroups.ACTIVATE_TOOL_DOC`).
- `ActivationManual.INACTIVE_HEADING`: the line above the stub list.
- `ActivationManual.INACTIVE_DIRECTIVE`: the closing "match the request to a
  capability and USE it" rule, which steers widgets to `live_artifacts`,
  documents to `artifacts` and pictures to `images`.

[ToolGroups](../ToolGroups.md)`.buildInactiveRegistry` joins them around the
stub lines.
