# ImageSlotRoles

`core/image-server/service/ImageSlotRoles.js`

The image server's three slots: role names, how a loose role resolves to one,
and what a role plus a model say about a launch.

## Methods

- Statics `GENERATE` (`image-generate`), `EDIT` (`image-edit`), `VIDEO`
  (`image-video`), `ALL`, `DEFAULT_KEYS` (`modelId`, `editModelId`, `videoModelId`).
- `ImageSlotRoles.normalize(role)` edit and video stay; anything else is generate.
- `ImageSlotRoles.pickerRole(role)` edit stays; anything else is generate (the
  server pickers know only those two).
- `ImageSlotRoles.defaultKey(role)` the getDefaults() field pinning the slot's model.
- `ImageSlotRoles.profile(role, model)` `{ isEdit, isVideo, isWanVideo }`: the slot
  or the model's `kind` makes a launch edit- or video-class; Wan is
  `family === 'wan-video'`.
