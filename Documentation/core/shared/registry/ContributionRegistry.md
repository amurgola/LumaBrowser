# ContributionRegistry

`core/shared/registry/ContributionRegistry.js`

Base class for registries that extensions contribute entries to: entries keyed
by id, indexed by owning extension, removable in bulk when the extension
deactivates.

Subclasses: [ChatModeRegistry](../../llm-server/chat/ChatModeRegistry.md),
[SetupTabRegistry](../../llm-server/chat/SetupTabRegistry.md),
[ModelCatalogRegistry](../../llm-server/models/ModelCatalogRegistry.md),
[RuntimeCatalogRegistry](../../llm-server/runtimes/RuntimeCatalogRegistry.md),
[ImageCatalogRegistry](../../image-server/models/ImageCatalogRegistry.md).

## Methods

- `register(entry, extensionId = null)` validates, stores a copy (id trimmed,
  owner stamped as `_extensionId`) and returns the stored entry. Re-registering
  an id replaces the entry and moves it to the new owner.
- `unregister(id)` removes one entry; returns `false` when absent.
- `unregisterByExtension(extensionId)` removes every entry the extension owns;
  returns the count.
- `get(id)` returns the stored entry itself (functions and owner included), for
  in-process callers such as the chat router. `null` when absent.
- `getById(id)` and `list()` return the public projection, never the owner id.
- `has(id)`, `extensions()` (extension ids that own at least one entry).
- `static ERROR_PREFIX` and `static ENTRY_NOUN` shape validation errors, e.g.
  `registerMode: descriptor.id is required`.

## Subclass hooks

All optional.

- `_validate(entry, id)` throws on a bad entry, after the object and id checks.
- `_toStored(entry, id)` shapes the stored copy. The trimmed id and the owner
  are always set on top, so a subclass cannot lose or spoof them.
- `_toListed(stored)` is the public projection for `list` and `getById`.
  Default: the stored entry minus `_extensionId`.
- `_onUnregistered(id)` cleans up side data for one entry.
- `_onExtensionRemoved(extensionId)` cleans up per-extension side data.
- `_changed()` runs after every successful register and unregister.

## Why one base class

Legacy had five hand-written copies of this contract and they drifted. During
the port two agents each wrote a base class for their own registries; they were
merged here because the reuse rule says one implementation.

TtsEngineRegistry does not extend this class: it must keep the engine objects
themselves (with their prototype methods), while this base stores copies.

## Bug fixed in the port

Legacy registries left a re-registered id in its previous owner's index. If
extension B re-registered an id first registered by A, deactivating A deleted
B's entry. Ownership now moves with the registration.
