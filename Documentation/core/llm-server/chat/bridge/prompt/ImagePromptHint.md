# ImagePromptHint

`core/llm-server/chat/bridge/prompt/ImagePromptHint.js`

The per-model image prompting block that rides with the images manual.

## Methods (all static)

- `fetch(imageRouter, picks = null)`: `getFrameSizes(null, picks)`,
  `getEditPromptInfo(picks)` and `getActivePromptInfo('generate', picks)` (each
  optional except the last) into `build`; null when the router is absent or
  anything throws. `picks` is the conversation's own image and edit model
  ([ConversationMediaModels](../../router/ConversationMediaModels.md)), so the
  guides describe the models its tools will really run on.
- `build(info, frames = null, editInfo = null)`: lines for the generation
  guide (`ACTIVE IMAGE MODEL: PROMPTING GUIDE for generate_image (...)`, the
  guide, and the default-negative note with the negative clipped to 160
  characters), the edit guide, and one `edit_image FRAMES on the edit model
  "...": <frame> WxH (use); ...` line. Null when there is nothing to say.
- `MAX_NEGATIVE_CHARS`.
