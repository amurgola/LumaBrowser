# CharacterChronicle

`extensions/roleplay-mode/world/CharacterChronicle.js`

A character's chronicle, append-only: one short beat per turn they took part
in, the newest kept verbatim, older ones folded by consolidation into a rolling
arc. `char.chronicle = { arc, beats: [{ turn, messageId, text }] }`.

## Methods

- `CharacterChronicle.of(char)` never null.
- `addBeat(char, { turn, messageId, text })` trims to `BEAT_MAX_CHARS` (240); a
  second beat for the same message replaces the first. Returns true when changed.
- `needsFold(char)` more than `MAX_BEATS` (12) beats; `foldable(char)` the
  oldest `FOLD_COUNT` (8), never the newest `KEEP_VERBATIM` (4);
  `applyFold(char, arcText, foldedCount)` replaces the arc and drops them.
- `recent(char, n = 4)` newest first-to-last; `forget(char, messageId)` drops
  the beats a removed or regenerated turn produced.

## Why

Rewriting one summary every few turns loses detail and degrades (the
SillyTavern Summarize and Qvink Memory experience); per-turn beats folded in
batches keep the newest history exact and the older history stable.
