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

Records come from `imageRouter.resolveModelRecord(id)` when it exists, else an
`ImageModelResolver` over the image server service's models directory.
