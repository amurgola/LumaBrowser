# PseudoToolSchemaTable

`core/llm-server/chat/tool-schemas/PseudoToolSchemaTable.js`

Data only: the JSON schemas of the chat pseudo-tools (the tools AgentChatBridge
injects, as opposed to browser and extension tools).

## Members

- `PseudoToolSchemaTable.ENTRIES` (frozen, registration order):
  `{ name, description, properties, required }` for `create_artifact`,
  `edit_artifact`, `create_live_artifact`, `generate_image`, `edit_image`,
  `generate_video`, `animate_image`, `generate_music`, `web_search`,
  `search_knowledge_base`, `validate_code`, `get_artifact_data`,
  `update_artifact_data`, `send_webhook`, `schedule_artifact_updates`.
- `PseudoToolSchemaTable.ACTIVATE_TOOLS`: the `activate_tools` meta-tool.

## Rules

- Descriptions carry the same teaching as the prose manuals. `create_artifact`
  explains `type` because Qwen3.8 sent `content` alone and llama.cpp does not
  enforce `required`.
- `web_search` keeps its name and its `query` / `url` / `find` parameters (a
  fine-tuned router depends on them) and adds `part` for paged reading.
- `edit_artifact` has `html`, `js`, `libs`: the only way to edit a live module
  (a `content` blob renders blank).
- `create_live_artifact.js` names every injected value, including
  `luma.ext(id)` for extension data (the Hub, id `personal-hub`).
- Known drift kept from legacy and pinned by `ToolDocSurfaces.test.js`:
  `generate_music.seed` is schema-only, `validate_code.filename` is prose-only.
