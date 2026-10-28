# HistoryTrimmer

`extensions/roleplay-mode/prompts/HistoryTrimmer.js`

Keeps the newest raw turns that fit the history budget.

## Methods

- `HistoryTrimmer.trim(messages, tokenBudget)` -> `{ messages, dropped }`. Cuts
  at a user-turn boundary, never below `PromptBudget.MIN_HISTORY_MESSAGES` (4);
  returns the same array when nothing was cut. The story summary stands in for
  what was dropped.
