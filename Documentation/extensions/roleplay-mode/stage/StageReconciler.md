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
  fact survives the card.
- `StageReconciler.tellsSecret(hides, text)`.

## Why the reveal path

Before it, a secret only left the card at the next fold (more than twelve
beats later), so for many turns the narrator was told to keep guarding
something the story summary said was already out.
