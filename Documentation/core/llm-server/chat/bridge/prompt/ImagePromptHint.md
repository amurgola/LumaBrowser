# ImagePromptHint

`core/llm-server/chat/bridge/prompt/ImagePromptHint.js`

The per-model image prompting block that rides with the images manual.

## Methods (all static)

- `fetch(imageRouter)`: `getFrameSizes(null)`, `getEditPromptInfo()` and
  `getActivePromptInfo('generate')` (each optional except the last) into
  `build`; null when the router is absent or anything throws.
- `build(info, frames = null, editInfo = null)`: lines for the generation
  guide (`ACTIVE IMAGE MODEL: PROMPTING GUIDE for generate_image (...)`, the
  guide, and the default-negative note with the negative clipped to 160
  characters), the edit guide, and one `edit_image FRAMES on the edit model
  "...": <frame> WxH (use); ...` line. Null when there is nothing to say.
- `MAX_NEGATIVE_CHARS`.
