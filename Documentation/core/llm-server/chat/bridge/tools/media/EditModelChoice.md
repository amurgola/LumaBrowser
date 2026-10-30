# EditModelChoice

`core/llm-server/chat/bridge/tools/media/EditModelChoice.js`

Decides how edit_image will run on this box.

## Methods

- `EditModelChoice.resolve(imageRouter)`: never throws. Fields: `editModelId`
  (the edit default), `unifiedGenEdit` (no edit default and the generation
  default `supportsEdit`), `editFamily`, `remoteEdit` (the active
  `image-edit` server is remote).
- `editCapable`, `profile` (`EditProfiles.editProfileFor(family)`, null for a
  remote editor), `maxReferences` (the profile's, else `EditReferences.MAX`).
- `editDefaults`: the resolved record's defaults. `regionSteps`: the step
  count for a region (localized) edit from `REGION_STEPS` (`qwen-image-2`:
  12), or null for a remote editor, another family, or a distilled checkpoint
  (fixed sigmas, or a default already at or under the count). Qwen-Image 2.1's
  own notes say localized edits hold up at 4 to 8 steps while whole-frame
  rewrites need 25; 12 measured indistinguishable from 20 on a held region
  edit at half the time (2026-10-29).

Records come from `imageRouter.resolveModelRecord(id)` when it exists, else an
`ImageModelResolver` over the image server service's models directory.
