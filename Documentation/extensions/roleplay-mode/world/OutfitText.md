# OutfitText

`extensions/roleplay-mode/world/OutfitText.js`

Outfit description text: normalised comparison, slot-by-slot layer
comparison, the short display name and render-safe wording.

## Methods

- `OutfitText.normalize(s)` lowercase, `[a-z0-9, ]` only, collapsed spaces.
- `OutfitText.same(a, b)` equal after normalising, or (no negation word on
  either side) one's 3+ letter words are a subset of the other's.
- `OutfitText.sameSlots(a, b)` true/false comparing `outer/top/bottom/feet`
  with `same`, or null when either map is missing.
- `OutfitText.displayName(desc)` the first comma phrase, 28 characters plus an
  ellipsis, `'Outfit'` when empty.
- `OutfitText.renderDesc(s)` `faded` -> `muted-colour`, `worn`/`worn-out` -> `soft`.
