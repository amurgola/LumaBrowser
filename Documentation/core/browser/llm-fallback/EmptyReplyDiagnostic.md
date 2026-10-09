# EmptyReplyDiagnostic

`core/browser/llm-fallback/EmptyReplyDiagnostic.js`

Debug-only description of a completion whose text came back empty.

## Methods

- `EmptyReplyDiagnostic.summarize(response)`: `{ topLevelKeys, choicesLen,
  choice0Keys, choice0FinishReason, messageKeys, messageContentType,
  messageContentPreview, contentTopKeys, stopReason, usage }`, covering
  OpenAI- and Anthropic-shaped responses.
- `EmptyReplyDiagnostic.fullDump(response)`: JSON (or `String()` when not
  serialisable), capped at 4000 characters.

Used by LlmFallbackService only when `LlmFallbackService.debug` is on, to tell a
genuinely empty answer (thinking ate the budget) from a provider shape the text
reader cannot see.
