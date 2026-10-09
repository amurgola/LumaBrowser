# ContextSurface

`core/shell/extensions/ContextSurface.js`

Base class for one area of an extension's activation context. A surface is
built once per manager; `forExtension(id)` hands each extension a fresh plain
object of arrow functions already bound to its id (so destructuring works).

## Methods

- `key` (getter) the context property it fills, e.g. `chat`. Throws unless overridden.
- `forExtension(extensionId)` the object for one extension. Throws unless overridden.

## Implementations

[ChatSurface](ChatSurface.md) (`chat`), [SetupTabSurface](SetupTabSurface.md) (`setupTab`), [ImageCatalogSurface](ImageCatalogSurface.md) (`imageCatalog`), [LlmCatalogSurface](LlmCatalogSurface.md) (`llmCatalog`), [VoiceSurface](VoiceSurface.md) (`voice`), [CodeSurface](CodeSurface.md) (`code`).
