# UserToolStore

`extensions/tool-forge/UserToolStore.js`

Persists AI-created tools as one JSON array under `toolForge.tools`. Extends
[JsonCollectionStore](../../core/database/JsonCollectionStore.md). A tool's
code is data; it only ever runs in the sandbox.

Record: `{ id, name, label, description, inputSchema, configSlots: [{ key,
label, description, required, secret }], allowedHosts, code, version,
status: 'draft'|'published', lastTest: { ok, codeHash, at, sampleArgs,
resultPreview } | null, createdAt, updatedAt, publishedAt }`.

## Methods

- `UserToolStore.isValidName(name)`: `^[a-z][a-z0-9_]{2,40}$` (`NAME_RE`).
- `get(idOrName)`: by id, else by exact name.
- `published()`.
- `upsertDraft(fields)`: throws `Invalid tool name "<name>". Use 3-41 chars: ...`;
  creates, or replaces the record with that name keeping `id`, `createdAt`,
  `publishedAt` and (when not given) `label`, bumping `version`. Always
  `status: 'draft'`. `lastTest` is the given value, else the existing one.
- `patch(id, changes)`: merge plus `updatedAt`; `Tool not found` for an unknown id.
- Statics `STORAGE_KEY` (`'toolForge.tools'`), `NAME_RE`.

## Why

The name is the tool's identity (config, denylist and aggregator key on it), so
it is fixed at creation and never patched.
