# HistoryTrimmer

`extensions/roleplay-mode/prompts/HistoryTrimmer.js`

Keeps the newest raw turns that fit the history budget.

## Methods

- `HistoryTrimmer.trim(messages, tokenBudget)` -> `{ messages, dropped }`. Cuts
  at a user-turn boundary, never below `PromptBudget.MIN_HISTORY_MESSAGES` (4);
  returns the same array when nothing was cut. The story summary stands in for
  what was dropped.

## Reasoning

`HistoryTrimmer.withoutReasoning(messages)` -> `{ messages, cleaned }`
strips inline `<think>...</think>` from earlier assistant replies before they
are sent back; the same array is returned when none had any. The chat store
keeps streamed reasoning in its own field and never resends it, but a model
that writes the tags into its visible reply would otherwise send that
reasoning back on every later turn. [NarratorContext](NarratorContext.md)
runs it before trimming and reports `cleaned`; the descriptor then sends the
cleaned history.
