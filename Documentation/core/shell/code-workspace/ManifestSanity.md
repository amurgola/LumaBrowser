# ManifestSanity

`core/shell/code-workspace/ManifestSanity.js`

Pre-flight for an extension the coding agent built, before activation, so the
classic "manifest references main.js but it was never written" fails here with a
readable list instead of inside activation.

## Methods

- `ManifestSanity.check(dir, workspaceId)` returns `{ ok, errors, manifest }`:
  - `manifest.js is missing`, `manifest.js failed to load: <msg>`,
    `manifest.js must export an object` (manifest null);
  - `manifest is missing "id"`, `manifest id "<x>" must equal the workspace id "<id>"`,
    `manifest is missing "name"`;
  - `manifest.<field> → "<rel>" does not exist` for each declared surface in
    `SURFACES` (`main`, `renderer`, `routes`, `mcpTools`, `chatModes`, `chatUi`,
    `setupTab`), declared as a path or `{ file }`.

The manifest is `require()`d fresh (cache entry dropped), so it reads the real
filesystem, not the workspace's routed fs.
