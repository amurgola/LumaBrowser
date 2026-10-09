# artifact-data-client.js (classic)

`core/llm-server/ui/js/artifact-data-client.js`

Classic-script exception: sets `window.LumaArtifactData = { create }` for the
standalone live-artifact page that
[LiveModuleDocument](../../chat/artifacts/LiveModuleDocument.md) writes. That
page loads `/llm-ui/js/artifact-data-client.js` with a plain script tag and its
inline bootstrap calls `window.LumaArtifactData.create(...)` synchronously, so a
module cannot serve it.

Module code uses [ArtifactDataStore](artifacts/ArtifactDataStore.md) instead.

## API

`window.LumaArtifactData.create({ rootId, transport })` returns the same store
shape as `ArtifactDataStore.create` (`get`, `all`, `set`, `remove`, `onChange`,
`readOnly`, `dispose`).

## Globals

Writes `window.LumaArtifactData`. Reads `localStorage`, `fetch`.

## Retiring it

Change request (wave report): make LiveModuleDocument's page load a module that
imports `ArtifactDataStore` and run its bootstrap as a module script; then delete
this file and its parity run.
