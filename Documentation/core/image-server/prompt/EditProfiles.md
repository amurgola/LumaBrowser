# EditProfiles

`core/image-server/prompt/EditProfiles.js`

How each edit-capable model family wants a reference-image edit worded, applied
to every reference-image request whoever sent it.

## Methods

- `EditProfiles.editProfileFor(family)` returns
  `{ refTag, maxReferences, keepClause, presizeRefs, refArea, refMaxPixels,
  renderScale, renderMaxPixels, family }`
  (completed from `GENERIC_PROFILE`), or `null` for a family without a profile.
- `EditProfiles.tagFor(style)` returns the naming function for `'word'`
  (`image N`), `'angle'` (`<imageN>`) or `'picture'` (`<Picture N>`); unknown
  styles are `'word'`.
- `EditProfiles.normalizeRefTags(prompt, { style = 'word', count = 0 })`
  rewrites every mention of input image 1..count (any of "image 2", "Picture 2",
  "photo #2", "<image_2>", "< Image 2 >") into the family's form. Double-quoted
  text (straight or curly) is left exactly as written; below two images nothing
  is rewritten; a sentence-opening capital is kept on the word form.
- `EditProfiles.referencePreamble(refs, style = 'word')` names the source as
  image 1 and each reference after it, with its optional `use`.
- `EditProfiles.keepClause({ style = 'word', count = 1 })` is the one blanket
  preservation sentence, in the family's naming.
- `EditProfiles.applyEditProfile(prompt, { family = null, refCount = 0 })`
  normalises the mentions and appends the keep clause when the profile asks for
  one and the prompt states none. No profile or no references passes through.
- Constants: `DEFAULT_MAX_REFERENCES` (3), `REF_TAGS`, `GENERIC_PROFILE`,
  `PROFILES` (`qwen-image-2`, `minimax-h3-image`, `qwen-image-edit`, `flux-kontext`), `REF_MENTION`,
  `QUOTED`, `HAS_KEEP`.

## Why

An edit model reads the source and every reference as pictures, and each family
was trained on its own way of naming them. Qwen-Image 2.1's runtime writes
`<image1>`, `<image2>` in front of each picture's vision tokens and Qwen's own
rewriter is told the tags are mandatory for two or more images. Qwen-Image-Edit
and Flux Kontext read plain words.

An edit model wants an instruction plus one blanket keep clause; describing what
should stay the same makes the model redraw it, which is how a face drifts.
Callers that are not the chat agent never read the guide, so the clause is added
here.

The reference cap is what runs well, not what the model accepts: Qwen-Image 2.1
takes ten images, but at a 1 MP canvas on a 32 GB card four took 55 s and six
took 160 s at a 28.7 GB peak. For `qwen-image-2` the router presizes each
supporting reference to half a megapixel (`refArea`): likeness and garment
detail matched the full canvas area at three quarters of the time, a quarter
megapixel started losing the garment.

MiniMax-H3-Image names its inputs `<Picture 1>`, `<Picture 2>` (its model card
and its own prompt rewriter use that form). Its references are not presized:
sd-server resizes each one itself, to a 1024 px short edge for the text encoder
and to a 1024 to 2048 px short edge for the VAE. That VAE encodes in 256 px
tiles: one 1 MP reference took 23 s through sd-cli and about 9 s on a warm
sd-server (RTX 5090, 2026-11-10), and a 4 MP one four times that, so the
profile's `refMaxPixels` caps what is sent at 1 MP whatever the canvas. A
full-size reference did not look better in a same-seed edit of a 2048x2048
picture.

The same family sets `renderScale` 1.5 and `renderMaxPixels` 16 MP: an edit
rendered at its source's own pixel size comes back over-sharpened, so the
router renders it larger and scales the result back (measurements in
[EditRenderScale](../router/EditRenderScale.md)).
