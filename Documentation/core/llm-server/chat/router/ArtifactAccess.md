# ArtifactAccess

`core/llm-server/chat/router/ArtifactAccess.js`

Read and data access to stored artifacts for the sharing host, share links and the web client.

## Methods

- `new ArtifactAccess({ getAgentDeps })`.
- `get(id)` (or null), `html(id, opts)` (`renderedHtml`, or null), `data(idOrRootId)` and `mutate(idOrRootId, ops)` (`artifactDataStore.all` / `.mutate`, or `{ success: false, error: 'artifact data unavailable' }`), `listFor(conversationId)` (or `[]`).

## Why

The stores exist only once the browser and extensions are up; callers get an empty answer before that.
