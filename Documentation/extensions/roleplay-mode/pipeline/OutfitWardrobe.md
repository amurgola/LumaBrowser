# OutfitWardrobe

`extensions/roleplay-mode/pipeline/OutfitWardrobe.js`

Points a character at the outfit record for what they wear now.

## Methods

- `OutfitWardrobe.ensure(char, outfitDesc, pendingOutfits, slots)` reuses a match
  (by layers, else fuzzy text; backfills layers) or creates a record and queues
  `{ charId, outfitId, sourceRef }`; true when `currentOutfit` changed.
