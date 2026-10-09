# ArtifactStore

`core/network-sharing/webapp/public/js/store/ArtifactStore.js`

Cached artifacts: `{ id, conversationId, messageId, title, type, language, content, createdAt }`
(content is base64 for images).

## Methods

- `new ArtifactStore(repo)`.
- `put(artifact)`: `id` (`art_...`) and `createdAt` default; resolves the stored record.
- `get(id)`, `list(conversationId)` (by index, `[]` when none), `delete(id)`.
