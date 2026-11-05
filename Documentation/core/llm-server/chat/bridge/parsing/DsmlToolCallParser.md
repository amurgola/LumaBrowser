# DsmlToolCallParser

`core/llm-server/chat/bridge/parsing/DsmlToolCallParser.js`

Parses DeepSeek's DSML tool-call markup when it reaches the chat as text.

## Methods (all static)

- `hasOpener(content)`: a `<｜DSML｜ calls>`, `<｜DSML｜tool_calls>`,
  `<｜DSML｜function_calls>` or `<｜DSML｜invoke` tag, with or without the space
  after the bars, fullwidth (U+FF5C) or ASCII bar.
- `parseAll(content)`: every `invoke` in model order as `{ tool, params }`.
  An invoke cut before its closing tag still counts when it has at least one
  closed parameter, marked `__repaired`; one cut before any parameter is
  dropped (a bare name must re-prompt, not run with fabricated arguments).
- `parseFirst(content)`: the first call or null.
- `parseParams(body)`: `{ values, count }` from the `parameter` tags.
  `string="true"` keeps the trimmed text; anything else goes through
  [XmlToolCallParser](XmlToolCallParser.md)`.coerceParam`, so numbers, booleans,
  null, arrays and objects arrive typed.
- `toolName(buf)`, `paramValue(buf, key, max)`: the sniffer's reads of a
  streaming buffer.
- `EARLY`: the streaming trigger, `<｜DS` (fullwidth bar) or a complete `<|DSML|`
  (ASCII bar), used by [IterationStream](../turn/IterationStream.md) to collapse
  the reply into the pending card before any tag closes.
- `BAR`, `OPEN`, `INVOKE`, `PARAM`.

## Why

DeepSeek V4 and V4.1 are trained on DSML and emit it whatever the system prompt
asks for; V4.1 names the block `calls` with a leading space in every tag
(`<｜DSML｜ invoke name="navigate">`), V4 `tool_calls`, V3.2 `function_calls`.
llama-server parses the markup into `tool_calls` only when the request
registered tools (the `deepseek4` family in
[ModelFamilyTable](../../../server/ModelFamilyTable.md) turns that on), so a
call on the text-fence path, or one the server failed to parse, arrived in the
chat as raw text and nothing ran (DeepSeek-V4.1-Flash, 2026-11-04). This parser
sits in [LooseToolCallParser](LooseToolCallParser.md)'s ladder after the XML
shapes, and [ToolCallSniffer](ToolCallSniffer.md) and
[OffFormatShape](OffFormatShape.md) know the shape as `dsml`.
