# EditProfiles

`core/image-server/prompt/EditProfiles.js`

How each edit-capable model family wants a reference-image edit worded, applied
to every reference-image request whoever sent it.

## Methods

- `EditProfiles.editProfileFor(family)` returns
  `{ refTag, maxReferences, keepClause, presizeRefs, refArea, family }`
  (completed from `GENERIC_PROFILE`), or `null` for a family without a profile.
- `EditProfiles.tagFor(style)` returns the naming function for `'word'`
  (`image N`) or `'angle'` (`<imageN>`); unknown styles are `'word'`.
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
  `PROFILES` (`qwen-image-2`, `qwen-image-edit`, `flux-kontext`), `REF_MENTION`,
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
