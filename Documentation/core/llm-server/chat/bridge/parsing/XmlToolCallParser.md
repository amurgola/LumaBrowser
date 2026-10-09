# XmlToolCallParser

`core/llm-server/chat/bridge/parsing/XmlToolCallParser.js`

Parses the native XML tool-call syntaxes the Qwen and Hermes families revert to.

## Methods (all static)

- `hasOpener(content)`.
- `parseLast(content)`: the last `<tool_call>` (else the first `<function=>`)
  region, or null.
- `parseAll(content)`: one call per region when there are at least two; a
  `<function=>` inside a `<tool_call>` wrapper is its body, not a second call.
- `parseRegion(raw)`: a JSON body first (balanced, else repaired and marked
  `__repaired`; escapes fixed on retry), as the whole call or as the
  arguments of the tag's name; else `<parameter=key>value</parameter>` pairs
  when the region has a parameter or a closing tag. A JSON body that could not
  be read and no parameters gives null (re-prompt, not a fabricated `{}`).
- `coerceParam(raw)`: numbers, booleans, null, objects and arrays parse;
  everything else stays the raw string.
- `OPEN`, `OPEN_GLOBAL`, `FN_NAME`, `PARAM`, `WRAPPER_OPEN`, `WRAPPER_CLOSE`,
  `PLACEHOLDER_NAME` (`tool`).
