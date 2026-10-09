# ArtifactActions

`core/llm-server/ipc/ArtifactActions.js`

The chat's artifact sidebar.

## Methods

- `new ArtifactActions(deps)`; `deps` is [LlmIpcDeps](LlmIpcDeps.md) (the agent deps'
  `artifactStore` and `browserService`, `artifactDataStore`, `artifactTaskStore`).
- `listForConversation(id)`, `listAll(opts)` `{ artifacts }`; `versions(idOrRootId)`
  `{ versions }` oldest first. Empty without a store.
- `get(id)` `{ success: true, artifact: { id, title, type, language, content, rootId, version } }`.
- `open(id)` renders the file and opens it in a tab: `{ success: true, url }`.
- `delete(id)` one version: `{ success: true, removed }`. Once the chain's last
  version is gone, its live-module data and scheduled tasks are purged.
- `deleteRoot(idOrRootId)` the whole chain: purges data and tasks first (resolving
  the root needs the rows), then `{ success: true, removed }` (the version count).
- Refusals: `Artifacts aren’t available yet.` without a store (or a browser for
  `open`), `Artifact not found.`.

## Why

The chain stores are keyed by root id, so deleting v1 must not wipe the data v2
still renders from (bug W7-P71-B2). The data and task purges are independent
guards: nested, a missing data store once left scheduled tasks firing background
runs against a deleted widget forever (bug M6).
