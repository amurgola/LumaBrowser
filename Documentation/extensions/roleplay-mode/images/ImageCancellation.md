# ImageCancellation

`extensions/roleplay-mode/images/ImageCancellation.js`

Detects a user image cancel since a reaction started.

## Methods

- `mark()`, `wasCancelled(startSeq)`, `throwIfCancelled(startSeq)` (code
  `RP_IMAGE_CANCELED`; a stopped [ReactionScope](../pipeline/ReactionScope.md)
  throws its own stop first, so a replaced or removed reply's renders halt at
  the same checkpoints).
