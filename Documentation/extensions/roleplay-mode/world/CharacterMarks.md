# CharacterMarks

`extensions/roleplay-mode/world/CharacterMarks.js`

The physical details a story establishes about a character after setup: what
showed when boots came off or hands were looked at (calluses, a black
toenail, bunions, wasted calves, a scar, a smell they carry). The stage call
reports them per present character as `noticed` ([StagingPrompt](../stage/StagingPrompt.md)),
[StageReconciler](../stage/StageReconciler.md) stores them here, the narrator
card shows them as `noticed since:` right after `looks:`, and the stage roster
shows them as `| noticed:` so they are not reported twice. Without this, a
detail invented on one turn only lived in the raw history and drifted once that
was trimmed. Lasting marks only; passing states (wet, cold, swollen tonight)
stay in the character's condition.

## Methods

- `CharacterMarks.of(char)` -> `[{ turn, text }]` (stored as `char.marks`).
- `add(char, details, turn)`: skips blanks, details already recorded (same
  words, any case or punctuation) and details already in the looks; text
  capped at 120 chars, list at `MAX` (10, newest kept). True when anything was
  added.
- `line(char)` -> `"a; b"` or `''`.
