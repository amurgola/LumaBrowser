# ReactionEmotion

`extensions/roleplay-mode/emotions/ReactionEmotion.js`

Maps a character's moment to one of the five cached reaction buckets.

## Methods

- `ReactionEmotion.detect(state, content)` reads `state.emotion`, or the passage
  when no mood is tracked, against `RULES` (surprised, embarrassed, angry, sad,
  happy in that order); then the catalog on the short mood only; else null.
