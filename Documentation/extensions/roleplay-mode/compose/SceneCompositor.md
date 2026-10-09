# SceneCompositor

`extensions/roleplay-mode/compose/SceneCompositor.js`

Composites keyed figures onto a scene in pure pixels, tinted to the room's light.

## Methods

- `composeHero(sceneB64, bodyB64, opts)` -> `{ plateB64, place }`.
- `composeFigures(sceneB64, [{ b64, dx, figH }], opts)` -> `{ plateB64, places }`.
- `compositeFigure(sceneB64, keyed, { W, H, figH, dx, anchor })` -> `{ b64, place, scale }`.
- `spreadOffsets(n, spread = 0.22)`.
