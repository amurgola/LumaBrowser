# ExtensionAssetGate

`app/gateway/ExtensionAssetGate.js`

Decides which extension files the LLM chat page and the Dashboard may load at
`/llm-ui/ext/<extensionId>/<asset>`.

## Methods

- `new ExtensionAssetGate(extensionManager)`.
- `resolve(reqPath)`: `{ dir, path }` for a published file; `{ status: 400 }`
  for a bad path; `404` for no slash, an empty asset, an inactive extension or
  one without `chatUi`, `setupTab` or `dashboard`; `403` for any file not published.
- `handler()` an Express handler over `resolve` and [ConfinedFile](ConfinedFile.md)`.send`.
- `ExtensionAssetGate.publishedFiles(manifest)`: the `chatUi` and `setupTab`
  files (a string or `{ file, assets }`) plus their `assets`, then the Dashboard
  widget files and `dashboard.assets`
  ([DashboardContribution](../../core/shell/extensions/DashboardContribution.md)),
  as absolute paths. Dashboard files are served under their sub-path, so a
  widget module's relative imports work, but only when each imported sibling
  is listed in `dashboard.assets`; anything else in the folder is 403.

## Why

It is the loader bridge that lets an extension contribute UI into the locked
down `/llm-ui/` page. The extension folder holds its backend code (`main.js`,
`manifest.js`), so only the exact declared files are served.
