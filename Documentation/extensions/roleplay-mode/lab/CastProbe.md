# CastProbe

`extensions/roleplay-mode/lab/CastProbe.js`

Grades a text playthrough for what the consistency probe cannot see: whether
the cast sound like different people, and whether the narrator moves the story
on its own. Deterministic, no judge model.

## Methods

- `CastProbe.run({ data, transcript })` -> `{ checks, voice, initiative }`.
  Checks: `cast:distinct` (every pair's voice-cue overlap at most
  `MAX_VOICE_OVERLAP`, 0.5, and dialogue overlap at most
  `MAX_DIALOGUE_OVERLAP`, 0.4; passes trivially with fewer than two profiled
  speakers) and `narrator:initiative` (over at least
  `MIN_TURNS_FOR_INITIATIVE`, 4, turns: the longest run with no story movement
  is at most `MAX_GAP`, 4, and at least one move was unprompted).
- `voiceOverlap({ data, transcript })` -> `{ pairs: [{ a, b, voice, dialogue }],
  worstPair }`: Jaccard overlap of the content words of each pair's
  `profile.voice`, and of the `TOP_WORDS` (15) most frequent content words in
  the quoted lines each actually speaks (bold-name paragraphs).
- `initiative({ data, transcript })` -> `{ movedTurns, unpromptedTurns,
  longestGap, turns }`: a turn moved when a thread was opened or advanced
  (`StoryLedger.threadMoves`) or a ledger row was recorded on it; it was
  unprompted when the moved text shares fewer than two content words with the
  player's line for that turn.
- `spokenWords(transcript)`, `words(text)`, `topWords(lines)`, `jaccard(a, b)`.

## Why

Recall, slop and length say nothing about whether two invented characters are
the same person with different names, or whether the narrator only ever
answers. These two heuristics are cheap enough to run on every Lab text run
and move when the casting and drive prompts do. Reported beside the
consistency probe by [LabTextRun](LabTextRun.md) and
[LabTextReport](LabTextReport.md); both checks stay out of the consistency
score so a mocked run (no stage movement) still passes it.
