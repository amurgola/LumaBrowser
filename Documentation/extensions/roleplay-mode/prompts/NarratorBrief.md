# NarratorBrief

`extensions/roleplay-mode/prompts/NarratorBrief.js`

The narrator's standing brief, the cacheable head of every turn: role and
format, the prose rules (concrete detail, no narrated feeling, dialogue that
stands alone, varied rhythm, one beat, a handoff, characters know only their
card and the story so far, growth on the card is the current truth), the
length mode, the player's agency, and a short list of phrases to leave out.

## Methods

- `NarratorBrief.lines(data, { emptyWorld, playerName })`.
- `NarratorBrief.lengthMode(data)` `snappy` | `balanced` | `lush` from
  `data.lengthMode` (or `options.lengthMode`), default `balanced`;
  `LENGTH_MODES` carries each mode's words and paragraphs.
- `NarratorBrief.AVOID` the short list (about fifteen phrases). The full list
  is [ProseSlop](ProseSlop.md), used by the optional polish pass only, because
  long ban lists confuse small models.
