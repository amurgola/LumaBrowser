# BodyNotes

`extensions/roleplay-mode/prompts/BodyNotes.js`

Renders [BodyGrounding](../grounding/BodyGrounding.md) notes into the
narrator's context: a `## How their bodies work` layer right after the cast
cards, with a rule line (background facts, never quoted; let each body decide
what its owner can do, how fast and at what cost; show it in effort, breath,
balance and sensation, never in medical terms; keep each of them a capable
person), then one block per on-stage character with notes.

## Methods

- `BodyNotes.lines(grounding, present, window)` -> the layer's lines, or `[]`
  without notes. Each character's cap is the smaller of the `body` layer and
  an even split of `bodyTotal` ([PromptBudget](PromptBudget.md)), so a large
  cast shortens every block instead of dropping one.
- `block(name, notes, cap)`: the cards whole when they fit, otherwise each cut
  in proportion to its length.
- `prioritised(body)`: the "Fiction gets wrong" line moved first as "Avoid"
  and the "Keep them a person" line right after, since clipping cuts from the
  end and those two keep a limit from turning into helplessness (the first
  grounded run left Edda stuck at the bottom step for five turns with that line
  clipped off).
- `surfaceLines(surface, present, window)` -> the `## Up close this turn`
  layer for [SurfaceGrounding](../grounding/SurfaceGrounding.md) notes, under
  the `surface` cap. The rule asks for one to three concrete details that fit
  the body and the moment, a glance not an inventory, plainly and never
  clinically. Each block opens with the character's marks as `established:`
  (never clipped) and the card only fills in what is not established. A reveal
  run without this had the paraplegia card's "feet slightly swollen" overrule
  a recorded "no swelling".
- `block(name, notes, cap, established?)`.
- `short(title)` (lowercase, parenthetical dropped), `label(grounding, c)` ->
  `body: advanced age, arthritis in the hands` for the scene notes, or `''`.
