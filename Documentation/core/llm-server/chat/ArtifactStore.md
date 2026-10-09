# ArtifactStore

`core/llm-server/chat/ArtifactStore.js`

Backs the `create_artifact` tool: the model emits self-contained content
(html, svg, markdown, code, a live module, or generated media), and this store
persists it in `llm_artifacts`, writes a styled standalone document to
`<artifactsDir>/<id>.html` and returns a URL a real browser tab can open.

Content lives in SQLite, not just on disk, so a conversation reopened from
history can re-open its artifacts after the file is gone (`ensureFile`).

## Methods

- `new ArtifactStore({ settingsDb, artifactsDir, getWebBase })`. `getWebBase()`
  returns e.g. `http://127.0.0.1:3000`, or `null` when the gateway is off.
  `dir` is public (the data wipe sweeps it).
- `ArtifactStore.newId()`: `art_<ms>_<rand>`.
- `create({ conversationId, messageId, title, type, language, content, bytes, mime })`
  returns `{ id, title, type, language, rootId, version, url, filePath }`. A new
  artifact is v1 and its own root. Unknown kinds become html, a blank title
  becomes `Artifact`; media storage per [ArtifactContent](artifacts/ArtifactContent.md).
- `createVersion({ sourceId, conversationId, messageId, title, language, content, bytes, mime })`:
  an edit becomes the next version of the source's chain, appended after the
  chain's highest version even when editing an older one. The kind is fixed;
  title, language and conversation default to the source's. Throws
  `createVersion: source artifact "<id>" not found`.
- `get(id)`: `{ id, conversationId, messageId, title, type, language, content,
  rootId, version, createdAt, url }` or `null`.
- `renderedHtml(id, opts)`: the standalone document or `null`
  ([ArtifactDocument](artifacts/ArtifactDocument.md)); `opts` are the
  live-module surface options for Network Sharing and `/share`.
- `list(conversationId)`: one row per chain at its latest version, with
  `versionCount`, ordered by each chain's first appearance (editing never
  reshuffles). `[]` without an id.
- `listLiveRoots({ limit = 200 })`: live-module chains across all
  conversations, newest chain first: the Dashboard widget dock.
- `listAllRoots({ limit = 500 })`: every chain, newest first, with `bytes`
  (content of ALL versions), `conversationTitle` and `orphaned` (no
  conversation, or its conversation was deleted): the artifact manager.
- `rootIdFor(id)`: the chain's root id. Lenient: an id that names no row is
  returned as is, because `delete(id)` can remove the row whose id is the root
  while later versions live on. `null` only for an empty id.
- `versions(id)`: the chain's history oldest first, each with its own `id` and `url`.
- `delete(id)`: one version and its file; false when unknown.
- `deleteRoot(id)`: every version of the chain (the list shows one row per
  chain, so deleting must not let an older version resurface); returns rows removed.
- `reparent(id, { conversationId, messageId })`: moves a whole chain, e.g. files
  a delegated sub-agent made under its phantom `agent:<id>:<stamp>` conversation;
  returns rows moved.
- `ensureFile(id)`: re-materialises a missing document; returns its path or `null`.
- `urlFor(id)`: `<web base>/artifacts/<id>.html`, else a `file://` URL.

File writes throw `Failed to write artifact file: ...` after the row is saved,
so the tool result can report it and `ensureFile` can retry. File unlinks are
best-effort: a missing or locked file never blocks a delete.

## Trust

An artifact is model-authored HTML/JS rendered in a real tab, the same trust
model as Claude's artifact sandbox. It is served from 127.0.0.1 (or file://)
and only produced when the conversation has Tools on.
