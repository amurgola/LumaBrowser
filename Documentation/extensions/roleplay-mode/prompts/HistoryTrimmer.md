# HistoryTrimmer

`extensions/roleplay-mode/prompts/HistoryTrimmer.js`

Keeps the newest raw turns that fit the history budget.

## Methods

- `HistoryTrimmer.trim(messages, tokenBudget)` -> `{ messages, dropped }`. Cuts
  at a user-turn boundary, never below `PromptBudget.MIN_HISTORY_MESSAGES` (4);
  returns the same array when nothing was cut. The story summary stands in for
  what was dropped.

## Debris

`HistoryTrimmer.withoutDebris(messages)` -> `{ messages, cleaned }` strips
inline `<think>...</think>` and the chat's reply-choice fence
(```` ```choices ... ``` ````, also one cut off by a token limit) from earlier
assistant replies before they are sent back; the same array is returned when
none had either. `HistoryTrimmer.stripDebris(text)` does it for one reply
(the post-processor runs it on the reply before the stage call reads it).
The fence rode into conversations opened before the mode declined reply
choices (2026-11-09); the tags come from a model writing its reasoning into
the visible reply. The chat store
keeps streamed reasoning in its own field and never resends it, but a model
that writes the tags into its visible reply would otherwise send that
reasoning back on every later turn. [NarratorContext](NarratorContext.md)
runs it before trimming and reports `cleaned`; the descriptor then sends the
cleaned history.
