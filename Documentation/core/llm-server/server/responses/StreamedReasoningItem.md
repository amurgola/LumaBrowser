# StreamedReasoningItem

`core/llm-server/server/responses/StreamedReasoningItem.js`

The reasoning item while it streams (`rs_` id): `response.reasoning_text.delta`
and `.done`, finished with `reasoning_text` content and an empty summary. Extends
[StreamedTextItem](StreamedTextItem.md).

## Why

Local models emit raw reasoning, not summaries; Codex shows raw reasoning when
`show_raw_agent_reasoning = true`.
