# HistoryTrimmer

`extensions/roleplay-mode/prompts/HistoryTrimmer.js`

Keeps the newest raw turns that fit the history budget.

## Methods

- `HistoryTrimmer.trim(messages, tokenBudget)` -> `{ messages, dropped }`. Cuts
  at a user-turn boundary, never below `PromptBudget.MIN_HISTORY_MESSAGES` (4);
  returns the same array when nothing was cut. The story summary stands in for
  what was dropped.

## The cut moves in steps

The tokens that must go (the total over the budget) are rounded up to a whole
number of steps of `STEP_SHARE` (0.25) of the budget, counted from the oldest
message, and the cut lands on the next user turn after that point. Counted
from the start, the same old messages give the same sums on every turn, so
the cut stays where it is while the thread grows and then jumps a step. The
kept history is between about three quarters of the budget and all of it.

Every move of the cut changes the first message the server sees, and it then
re-reads the whole history. A cut that kept exactly the newest turns that fit
moved by one exchange on every turn once the budget was reached, which made
every turn a full re-read (see [NarratorContext](NarratorContext.md)).

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
