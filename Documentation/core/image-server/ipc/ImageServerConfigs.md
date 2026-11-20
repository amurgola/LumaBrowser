# ImageServerConfigs

`core/image-server/ipc/ImageServerConfigs.js`

The image server config area: the three local slots plus remote servers, with the active selection per role.

## Methods

- `new ImageServerConfigs(imageServerService)`.
- `view()` (async) `{ servers, active: { generate, edit, video } }`. Each local slot
  gains `models` (`[{ id, label }]`, the installed models of its kind from
  `listInstalledModels()`), `selectedModel` and `modelField` (the image default
  that holds the slot's model, from `InstalledImageModels.DEFAULT_FIELDS`), so a
  picker can offer them as a paired server's models are. A failed scan lists no models.
- `setActive(role, id)` `{ activeId }`.
- `ImageServerConfigs.roleOf(role)` `edit` / `image-edit` -> `image-edit`,
  `video` / `image-video` -> `image-video`, anything else `image-generate`.
