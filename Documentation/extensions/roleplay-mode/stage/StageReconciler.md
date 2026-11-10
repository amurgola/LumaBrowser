# StageReconciler

`extensions/roleplay-mode/stage/StageReconciler.js`

Applies the stage call's decisions to the working data.

## Methods

- `StageReconciler.apply(data, ex, delta, { turn, messageId })` new characters
  join (known ones get blank looks backfilled), the location switches to a known
  scene or creates one (when new, or when there are no scenes), the present cast
  becomes the moment state with outfit, layers and accessories, queueing outfit
  bodies through [OutfitWardrobe](../pipeline/OutfitWardrobe.md). Per present
  entry it also writes the character's [state](../world/CharacterState.md)
  (`arrive`), appends the `beat` to their [chronicle](../world/CharacterChronicle.md)
  and, when `bondChange` says so, their bond with the player; an entry with
  `present: false` departs with `leftTo`, and a character who was present and is
  no longer listed departs with the prior scene. The `chronicle` block records
  events, advances the clock and keeps threads (opened, advanced, closed) in
  the [StoryLedger](../world/StoryLedger.md); a `death` event departs that
  character for good, and a `reveal` event that plainly tells a character's
  secret (`tellsSecret`: two or more meaningful words in common) clears
  `hides` on their card. After the events, a present entry flagged `revealed`
  clears that character's `hides` too and, when the ledger has no reveal row
  for them this turn, records one ("<name>'s secret came out: ...") so the
  fact survives the card. A present entry's `noticed` details are added to the
  character's [CharacterMarks](../world/CharacterMarks.md).
- `StageReconciler.tellsSecret(hides, text)`.

## Why the reveal path

Before it, a secret only left the card at the next fold (more than twelve
beats later), so for many turns the narrator was told to keep guarding
something the story summary said was already out.

## Presence is a fact until the stage says otherwise

The stage call lists the characters a passage happens to mention, not
everyone in the room. A character present before but missing from the list,
in the same scene, therefore stays in the moment, however many turns pass.
They depart, with the prior scene remembered, in three cases only: an explicit
`present: false` (with `leftTo`), a change of scene (presence resets on a
move), or a `death` event. An old `state.unlisted` counter is cleared when seen.

History: at first any unlisted character departed at once, which sent a
five-person cast on and off stage turn by turn. A grace of three turns
(`UNLISTED_GRACE` 4, 2026-11-08) fixed the flicker but still departed a quiet
character on the fourth turn; a live run on Qwen 3.8 had to reset the scene
every few messages to get them back. Since 2026-11-09 nothing times out; the
[StagingPrompt](StagingPrompt.md) also asks for every present character,
quiet ones included.

## Changes (2026-11-09, the dead stay dead)

`isDead(char)` is true once a death event parked the character (a `dead:` note on `lastSeen`). `_presentEntry` ignores such a character however a later passage lists the body, and `_dropDead` removes them from the moment on the death turn itself. Taken at its word, the stage call put the corpse back on stage a turn or two after the death in one 27B run and one helper run of the Lab bench; the records now enforce the ledger.
