# ImageServerConfigs

`core/image-server/ipc/ImageServerConfigs.js`

The image server config area: the three local slots plus remote servers, with the active selection per role.

## Methods

- `new ImageServerConfigs(imageServerService)`.
- `view()` `{ servers, active: { generate, edit, video } }`.
- `setActive(role, id)` `{ activeId }`.
- `ImageServerConfigs.roleOf(role)` `edit` / `image-edit` -> `image-edit`,
  `video` / `image-video` -> `image-video`, anything else `image-generate`.
