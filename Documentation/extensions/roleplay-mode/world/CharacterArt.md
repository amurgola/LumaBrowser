# CharacterArt

`extensions/roleplay-mode/world/CharacterArt.js`

Picks a character's stored reference images.

## Methods

- `CharacterArt.bodyRef(c)` current outfit image, figure, legacy
  `art.fullBody`, `art.base`, `avatar`, else null.
- `CharacterArt.bodyRefForState(c, state)` the moment's `state.outfitId`
  image, then an outfit whose normalised desc equals `state.outfitDesc`, then
  `bodyRef`.
- `CharacterArt.faceRef(char, emotion)` `art[emotion]`, `art.base`, `avatar`.
- `CharacterArt.headRef(char)` `art.base` or `avatar`.
- `CharacterArt.hasFullBody(char)` true for a current outfit image, a figure or
  a legacy full body (never a head).
