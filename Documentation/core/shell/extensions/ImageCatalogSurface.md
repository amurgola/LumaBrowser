# ImageCatalogSurface

`core/shell/extensions/ImageCatalogSurface.js`

`context.imageCatalog`: downloadable image-model rows contributed by an extension.

## Methods

- `new ImageCatalogSurface({ registry = ImageCatalogRegistry.shared })`; `key` is `imageCatalog`.
- `forExtension(id)` -> `{ register(entry), unregister(rowId), list() }`;
  rows are owned by the extension and removed by [ExtensionTeardown](ExtensionTeardown.md).
