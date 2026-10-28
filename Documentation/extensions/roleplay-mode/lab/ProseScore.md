# ProseScore

`extensions/roleplay-mode/lab/ProseScore.js`

Grades the prose of a text playthrough without a judge model.

## Methods

- `ProseScore.run({ data, transcript })` -> `{ replies, perHundred, inBand,
  tagged, handoff, words: { min, max, avg }, band }`: average slop hits per
  hundred words ([ProseSlop](../prompts/ProseSlop.md)), the share of replies
  inside the length mode's band (`BANDS`), with a bold-name speaker tag, and
  ending on a handoff (a question, quote or full stop, not a trailing summary).
- `ProseScore.reply(text, band)` one reply's readings.
