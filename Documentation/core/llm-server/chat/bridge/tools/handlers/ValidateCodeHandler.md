# ValidateCodeHandler

`core/llm-server/chat/bridge/tools/handlers/ValidateCodeHandler.js`

`validate_code`: lints a piece of source in-process. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params)`: `code` (or `content`) is required; `language`/`lang`,
  `filename`/`file`; returns `{ success: true, ok, supported, summary,
  diagnostics, message: CodeValidator.formatForModel(v) }`.
