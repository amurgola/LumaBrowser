# ToolCallSniffer

`core/llm-server/chat/bridge/parsing/ToolCallSniffer.js`

Reads what a tool call is about from streaming or unparseable text.

## Methods (all static)

- `toolName(buf)`: from `"tool"`/`"name"` or a `<function=...>` tag (not the
  placeholder `tool`); null while not arrived.
- `target(buf)`: the first of `TARGET_KEYS` with a complete, closed value
  (JSON string, unescaped, or `<parameter=key>` value, trimmed), up to
  `TARGET_MAX` (120) characters; null otherwise.
- `attemptedToolName(content)`: the `"tool"` value, else `toolName`.
- `looksLikeAttempt(content)`: a ```tool fence, an XML opener, or a
  `"tool"` naming a known pseudo or browser tool (`KNOWN_CALL`).
