# SelectorPrompt

`core/browser/llm-fallback/SelectorPrompt.js`

Builds the selector-resolver prompt for [LlmFallbackService](../LlmFallbackService.md).

## Methods

- `SelectorPrompt.SYSTEM`: the fixed system instruction (return only a CSS
  selector, grounded in the snapshot, preferring id, data-testid, data-role,
  aria-label, name, role, then tag + attribute).
- `SelectorPrompt.build({ description, action, failedSelector, snapshot, feedbackContext })`
  returns `{ system, user }`. The user turn lists, in order: `Action:`,
  `Description:`, `Original selector that failed:` (if any), the rejected-attempt
  feedback (if any), the snapshot context.
- `SelectorPrompt.snapshotContext(snapshot)`: one line per element,
  `  <selector> [<tag> "<text>"] id=..., data-testid=..., data-role=..., aria-label="...", role=..., name=..., type=..., placeholder="...", disabled`
  with only the attributes present; `''` for an empty snapshot.
