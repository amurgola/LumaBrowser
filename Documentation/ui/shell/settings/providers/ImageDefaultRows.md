# ImageDefaultRows

`ui/shell/settings/providers/ImageDefaultRows.js`

Markup of the default image server rows (generation, editor, video) and a shared server's model picker.

## Methods

- `ImageDefaultRows.html(imageCfg, roleKey, label, selectId)`: `roleKey` is
  `image-generate`, `image-edit` or `image-video`; only servers of that kind are
  listed and the active id is read from `imageCfg.active[kind]`.
- `ImageDefaultRows.kindOf(roleKey)`: `edit`, `video`, else `generate`.

## Globals

None.
