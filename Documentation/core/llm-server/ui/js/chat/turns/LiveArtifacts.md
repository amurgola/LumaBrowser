# LiveArtifacts

`core/llm-server/ui/js/chat/turns/LiveArtifacts.js`

Live (interactive) artifacts render inline, mounted by
[LiveModuleMounter](../../live/LiveModuleMounter.md) on the next frame. The
mounted node is cached by id and moved into each re-rendered turn, so the
module's Resonant, charts and data store stay alive. The head carries Pin to
dashboard (desktop) and a share link (while the web backend runs).

## Methods

- `element(artifact)`.
- `dispose()`: drops every node and its data store (opening another
  conversation or a runs view).

The module gets an [ArtifactDataStore](../../artifacts/ArtifactDataStore.md)
over `api.artifactData` keyed by the chain's root id (none when its js declares
its own `store`) and a [LumaBridge](../../live/LumaBridge.md) over `api.liveApi`.
