# ImagePrompt

`extensions/roleplay-mode/prompts/ImagePrompt.js`

The base-model prompt for a reaction image, or a face-only extreme close-up of
one character.

## Methods

- `ImagePrompt.build(data, content, opts?)` `[subject tag, style, "featuring
  <people>, shown in the scene", "set in <scene>", gist (220 chars), framing,
  "digital artwork, detailed background"]` joined with `. `; people (at most two)
  carry appearance, enriched mood and outfit, never the persona. Framing is
  seated, full body or waist-up from the prose. `opts.closeUpOf` (a name) builds
  the close-up variant: no outfit, no gist, no scene, `simple background`.

## Why

An outfit clause in a close-up made the model add a small full-body copy of the
character to show the garments, and a scene name staged a second person.
