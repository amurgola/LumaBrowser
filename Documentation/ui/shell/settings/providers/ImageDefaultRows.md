# ImageDefaultRows

`ui/shell/settings/providers/ImageDefaultRows.js`

Markup of the default image server rows (generation, editor, video) and, under each, a model picker over the chosen server's models.

## Methods

- `ImageDefaultRows.html(imageCfg, roleKey, label, selectId)`: `roleKey` is
  `image-generate`, `image-edit` or `image-video`; only servers of that kind are
  listed and the active id is read from `imageCfg.active[kind]`.
- Model row: a paired server's models (`data-image-model-server`, first option
  "Host default"), or a local slot's installed models (`data-image-local-model`
  set to its `modelField`, the image default it edits; a disabled "Choose a model"
  option only while the saved model is none of them). No row without models, or
  for a local slot without `modelField`.
- `ImageDefaultRows.kindOf(roleKey)`: `edit`, `video`, else `generate`.

## Globals

None.
