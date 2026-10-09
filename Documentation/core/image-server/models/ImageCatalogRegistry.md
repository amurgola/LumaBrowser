# ImageCatalogRegistry

`core/image-server/models/ImageCatalogRegistry.js`

Holds image-model catalog rows contributed by extensions, which the core image
catalog merges into its own list.

## Methods

Inherited from [ContributionRegistry](../../shared/registry/ContributionRegistry.md):

- `register(entry, extensionId = null)` stores (or replaces) a row by trimmed
  `id`; errors read `imageCatalog.register: entry object is required` and
  `imageCatalog.register: entry.id is required`.
- `unregister(id)`, `unregisterByExtension(extensionId)`, `list()`, `getById(id)`,
  `extensions()`. Returned rows never carry the owning extension id.

Own members:

- `ImageCatalogRegistry.shared` is the one instance both the image server and
  ExtensionManager use.
- `ImageCatalogRegistry.ERROR_PREFIX` is `'imageCatalog.register'`.

Row shape is a core catalog row: `{ id, label, blurb?, family, kind:'generate'|'edit',
files:{...}, defaults?, minVramBytes?, launchArgs?, licenseNote?, protocol?, compatibleRuntimes? }`.

## Why

A shared instance rather than dependency injection, for the same reason as the
chat-mode registry: the image server is built at boot while extensions activate
later through ExtensionManager. Catalog reads happen on demand (panel open,
download, scan), always after activation, so the timing is safe.

Extending the shared contribution base fixed a legacy bug: re-registering a row
id under a different extension left the id in the old owner's index, so
deactivating the old owner deleted the new owner's row.
