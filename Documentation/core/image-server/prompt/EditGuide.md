# EditGuide

`core/image-server/prompt/EditGuide.js`

Builds the edit-prompt rules shown to the chat agent for the way `edit_image`
will actually run on this machine.

## Methods

- `EditGuide.build({ mode, label = '', family = null })` returns the guide text.
  `mode: 'img2img'` (no edit model; the generation model redraws the source)
  teaches describing the full final image and setting `strength`. Any other mode
  is the reference-image edit guide, written in the family's image naming from
  `EditProfiles` (generic word naming for an unknown family), teaching
  instruction-style prompts, one keep sentence, pointing at images instead of
  describing them, and the reference cap.

## Why

The wording rules differ by route: an edit model wants an instruction and must
not be told what stays the same (it redraws whatever is described), while
img2img needs the finished picture described in full. Keeping the guide next to
`EditProfiles` means the image naming the agent is taught always matches what
`applyEditProfile` enforces.
