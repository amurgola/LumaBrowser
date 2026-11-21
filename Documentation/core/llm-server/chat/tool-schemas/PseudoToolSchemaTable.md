# PseudoToolSchemaTable

`core/llm-server/chat/tool-schemas/PseudoToolSchemaTable.js`

Data only: the JSON schemas of the chat pseudo-tools (the tools AgentChatBridge
injects, as opposed to browser and extension tools).

## Members

- `PseudoToolSchemaTable.ENTRIES` (frozen, registration order):
  `{ name, description, properties, required, complexity? }` for `create_artifact`,
  `edit_artifact`, `create_live_artifact`, `generate_image`, `edit_image`,
  `generate_video`, `animate_image`, `generate_music`, `web_search`,
  `search_knowledge_base`, `validate_code`, `get_artifact_data`,
  `update_artifact_data`, `send_webhook`, `schedule_artifact_updates`.
- `PseudoToolSchemaTable.ACTIVATE_TOOLS`: the `activate_tools` meta-tool.

## Rules

- `complexity: 'heavy'` marks the tools that start long work behind short
  prompts (`create_artifact`, `edit_artifact`, `create_live_artifact`,
  `validate_code`); [RequestComplexity](../RequestComplexity.md) reads it and
  [ToolSchemas](../ToolSchemas.md) never copies it into the schema the model sees.
- Descriptions carry the same teaching as the prose manuals. `create_artifact`
  explains `type` because Qwen3.8 sent `content` alone and llama.cpp does not
  enforce `required`.
- `web_search` keeps its name and its `query` / `url` / `find` parameters (a
  fine-tuned router depends on them) and adds `part` for paged reading.
- `edit_artifact` has `html`, `js`, `libs`: the only way to edit a live module
  (a `content` blob renders blank).
- `edit_image.regionId` names a region the user painted in an earlier message
  (the catalog lists them); one painted in the message being answered always
  applies. Pixel masks never cross the schema.
- `create_live_artifact.js` names every injected value, including
  `luma.ext(id)` for extension data (the Hub, id `personal-hub`).
- Known drift kept from legacy and pinned by `ToolDocSurfaces.test.js`:
  `generate_music.seed` is schema-only, `validate_code.filename` is prose-only.

## Password manager

`vault_list { tabId? }` and `vault_fill { ref, tabId? }`.

`vault_fill` also takes `part: 'otp'`; `vault_list` describes keys too.

## call_tool (2026-11-20)

`PseudoToolSchemaTable.CALL_TOOL`: `name` (string, required: the tool to run)
and `params` (any object: that tool's parameters). Registered beside
`ACTIVATE_TOOLS` on every native run that has lazy groups, so a tool of a group
loaded after the conversation's first turn can be called without changing the
registered array ([NativeToolPlan](../bridge/tools/NativeToolPlan.md),
[CallToolCall](../bridge/tools/CallToolCall.md)).
