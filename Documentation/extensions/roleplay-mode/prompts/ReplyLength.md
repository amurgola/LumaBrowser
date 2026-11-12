# ReplyLength

`extensions/roleplay-mode/prompts/ReplyLength.js`

The word ceiling of one narrator reply, and what happens when the model runs
well past it. The scene notes state the ceiling (`NarratorContext.wordCap`,
from the size of the player's move). A reply longer than `OVERRUN` (1.5) times
its ceiling is cut back when it is stored, to about `KEEP` (1.25) times it:
whole trailing paragraphs go first, then trailing sentences of the last one
left, never mid-sentence and never below one sentence.

A cap on generated tokens was not used: it also counts a reasoning model's
thinking and would cut the answer off.

- `remember(conversationId, words)` / `recall(conversationId)`: the ceiling the
  newest turn was given, kept (bounded) until its reply is stored.
- `trim(text, cap)`: the cut reply, or the same string when it is within the
  overrun or no ceiling is known.
- `words(text)`.

## Allowance (2026-11-12)

`OVERRUN` and `KEEP` are both 2: the ceiling the narrator is told carries a
silent allowance of twice its size, because models count words badly. Told "at
most 250 words", a reply of up to 500 is stored as written; a longer one is cut
back to within 500, not to 250.
