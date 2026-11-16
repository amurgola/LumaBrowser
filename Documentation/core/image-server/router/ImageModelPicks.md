# ImageModelPicks

`core/image-server/router/ImageModelPicks.js`

A caller's own model per job, such as one chat conversation's image, edit and
video model, laid over the Setup defaults. A job with no pick follows its
default; a pick whose model is no longer installed is dropped.

## Methods (all static)

- `JOBS`: per job (`image`, `edit`, `video`) the `getDefaults()` field the pick
  replaces (`modelId`, `editModelId`, `videoModelId`) and the installed-model
  kind the picked model must be (`generate`, `edit`, `video`).
- `normalize(picks)`: only the known jobs with a non-empty string id survive,
  trimmed, as `{ image?, edit?, video? }` in that key order. Anything else
  (null, a string, an unknown job, an empty id) reads as no pick.
- `over(defaults, picks)`: a copy of `getDefaults()` with every picked job's
  model in place of its default. The other fields (`runtimeId`, `pinModelRam`)
  pass through.
- `installedOnly(picks, installed)`: the picks whose model is in `installed`
  (the rows of `ImageServerService.listInstalledModels()`, `{ id, kind }`) under
  its own job's kind. A unified generate and edit model is listed under both
  kinds there, so it can be picked for either job.

## Who uses it

- [ImageModelInfo](ImageModelInfo.md) and
  [ImageEditPromptInfo](ImageEditPromptInfo.md) take `picks` and read
  `over(getDefaults(), picks)` where they used to read the defaults, so the
  prompt guide, the edit rules and the edit frames describe the picked models.
- [EditModelChoice](../../llm-server/chat/bridge/tools/media/EditModelChoice.md)
  routes `edit_image` on the same overlay.
- [ConversationMediaModels](../../llm-server/chat/router/ConversationMediaModels.md)
  stores a conversation's picks and narrows them with `installedOnly`.

## Why

The chat's gear panel lets one conversation use its own image, edit and video
model. Every place that reads "the configured model" for a chat run has to see
the same substitution, or the agent is taught booru tags for a model that wants
prose, or an edit is sized for the wrong canvas. One overlay keeps them in step.
