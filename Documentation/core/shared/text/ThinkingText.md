# ThinkingText

`core/shared/text/ThinkingText.js`

Removes a model's reasoning from a reply that is used as plain text: the
`<think>...</think>` blocks some models emit even when asked not to think.

## Methods

- `ThinkingText.strip(text)`: the reply without its thinking blocks, trimmed; an
  empty string for null.
- `ThinkingText.BLOCK`: the pattern.

Used by [PromptApiService](../../prompt-api/PromptApiService.md) and
[TriggerMemoryFollowUp](../../llm-server/chat/trigger-runner/TriggerMemoryFollowUp.md).
