# OffFormatShape

`core/llm-server/chat/bridge/parsing/OffFormatShape.js`

Names the shape of a recovered off-format tool call for the health report.

## Methods (all static)

- `of(content)`: `xml-tool_call`, `xml-function`, `json-fence`,
  `malformed-tool-fence` or `bare-json`, checked in that order.
