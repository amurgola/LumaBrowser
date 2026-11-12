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
  describing them, and the reference cap. Both guides end with the marked
  region rule: img2img still describes the final image (the inpaint mask does
  the confining, strength 0.8 or higher), an edit model gets an instruction for
  what changes inside the area only (the location is appended for it). The
  reference guide also teaches the text-edit form ("Replace the text 'OPEN'
  with 'CLOSED', keeping the same font, size and colour"), that untouched
  parts are restored from the source after the render and a deliberate subtle
  whole-picture change needs `keepUnchanged: false`, and that a frame other
  than match extends the picture with the source kept whole, placed by
  `anchor`. It carries one exception to "do not describe what stays": when
  clothing is removed, shortened or swapped, the prompt states the person's
  build in one sentence (and the skin tone when more skin will show), never
  the face.

## Why

The wording rules differ by route: an edit model wants an instruction and must
not be told what stays the same (it redraws whatever is described), while
img2img needs the finished picture described in full. Keeping the guide next to
`EditProfiles` means the image naming the agent is taught always matches what
`applyEditProfile` enforces.

The build sentence comes from the 2026-11-11 round-trip runs (a figure in a
swimsuit dressed in a suit, then edited back by each model): with only a keep
sentence every editor drew a more average body under the clothes, a very thin
figure came back 6 to 11% thicker on FLUX.3 Image Klein, Qwen-Image 2.1,
Krea 2 Turbo and FLUX.2 klein 9B. Stating the build brought that to 2 to 7%,
and did not hurt a full figure. More steps, a stronger keep sentence, LoRA
weight and the community consistency LoRAs changed nothing measurable.
