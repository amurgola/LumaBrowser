# CastRole

`extensions/roleplay-mode/world/CastRole.js`

Tells the story's characters from its walk-ons. A walk-on is someone the prose
only labels ("Customer 1", "the guard", "Hooded Man"). A walk-on is tracked by
name and looks only, and becomes a character once the story keeps them.

## Methods

- `CastRole.isLabel(name)` true when the name is a label rather than a name:
  it is blank, ends in a number, opens with an article (`ARTICLES`), or is
  made only of role and descriptor words (`ROLE_WORDS`: customer, guard,
  waiter, man, woman, old, hooded and the like). "Old Tom" and "Mr. Chen" are
  names.
- `CastRole.isWalkOn(char)` true for a character with `origin === 'story'`
  (`CastRole.STORY`, stamped by
  [WorldDelta](../stage/WorldDelta.md)`.addCharacter`), a label for a name, and
  fewer than `ESTABLISHED_BEATS` (3) chronicle beats. A character the player
  set up, or one from a save older than the origin stamp, is never a walk-on.

## Why

The stage call listed walk-ons, a speaker tag added them, and the casting call
then wrote each a past, a secret and a set of tells that the narrator worked
into every reply. A live session gave two cafe customers "a decision they
regret" and a hoodie drawstring to fidget with.

## Wiring

[ProfileCall](../pipeline/ProfileCall.md)`.candidates` skips a walk-on, and
[NarratorContext](../prompts/NarratorContext.md)`.card` gives one a single
line ending `(in the background)`. [CastRename](CastRename.md) renames a
walk-on in place when the passage gives them a name, and
[StagingPrompt](../stage/StagingPrompt.md) marks a story-introduced label in
its roster with `isLabel`.
