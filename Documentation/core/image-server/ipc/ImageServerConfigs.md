# ImageServerConfigs

`core/image-server/ipc/ImageServerConfigs.js`

The image server config area: local slots plus remote servers, with the active selection per role.

## Methods

- `new ImageServerConfigs(imageServerService)`.
- `view()` `{ servers, active: { generate, edit } }`.
- `setActive(role, id)` `{ activeId }`.
- `ImageServerConfigs.roleOf(role)` `edit` / `image-edit` -> `image-edit`, anything else `image-generate`.
