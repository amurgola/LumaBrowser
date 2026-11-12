# CastRename

`extensions/roleplay-mode/world/CastRename.js`

Gives a walk-on its name. When the "Woman" on the porch says she is Clare, the
walk-on's own row takes the name: same id, looks, wardrobe, art and history.
The old label stays in `char.aliases`, and every record that named them
follows.

## Methods

- `CastRename.apply(data, ex, delta)` -> `[{ from, to }]`. `ex` is the parsed
  staging ([StagingParser](../stage/StagingParser.md)), `delta` the turn's
  [WorldDelta](../stage/WorldDelta.md). For each new character with a `was`
  it looks the walk-on up ([CastResolver](CastResolver.md)`.byName`, so an
  alias works too), checks `canRename`, clears a fresh row of the new name,
  and renames. Sets `delta.changed` when it renamed anyone. A reply with no
  `characters` list returns `[]`.
- `CastRename.canRename(char, name)` true only for a character the story
  introduced (`origin === 'story'`, [CastRole](CastRole.md)`.STORY`) whose
  current name is a label (`CastRole.isLabel`) and whose new name is not one.
  A character the player set up, one from a save older than the origin stamp,
  and one who already has a real name keep theirs.
- `CastRename.rename(data, char, name)` renames in place and returns the
  character. The old name is appended to `char.aliases` (each label once);
  `currentState.characters` entries for the character (by `charId` or the old
  name) take the new name; in every character's `profile.bonds` the key under
  the old name moves to the new one (a bond already recorded under the new
  name wins); every ledger row's `who` is rewritten. The ledger's sentences
  are left as written.

## When the stage call does not say

`_infer` fills in `was` for the one case that has a single reading, and only
when no new character of the reply carries a `was` at all:

- exactly one labelled walk-on is on stage (`currentEntries`) and the reply's
  present list does not mention it, present or not, and
- exactly one new character has a real name, is listed present, and is not
  established.

Two walk-ons, two new names, a walk-on that is still listed, a newcomer who
is not present, or a reply without a present list: nothing is inferred.

## What blocks a rename

- `canRename` (above).
- An established character of the new name. `_established` is true when the
  character of that name has chronicle beats, a `profile` or a `state` of
  their own. Two people stay two.

A character of the new name with none of those is the blank row the speaker
pass ([RoleplayPostProcessor](../pipeline/RoleplayPostProcessor.md)`._addSpeakers`)
added a moment earlier from the reply's `**Clare:**` tag. `_clearFresh`
removes it from the roster and from `delta.newCharIds`, so no art is queued
for a character that no longer exists.

## Why

The stage call reported the named person as a new character and the story
held two people for one, both on stage, each with a card. A replayed session
tripled the cast layer of the narrator's prompt on that turn and left the
nameless one standing there for good.

## Wiring

[StageReconciler](../stage/StageReconciler.md)`.apply` runs it first, before
the roster grows. [StagingPrompt](../stage/StagingPrompt.md) asks for `was`
and marks the labels in its roster. `CastResolver.byName` matches aliases, so
a later "**Woman:**" tag finds Clare.
