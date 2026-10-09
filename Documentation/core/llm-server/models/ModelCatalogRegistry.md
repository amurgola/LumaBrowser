# ModelCatalogRegistry

`core/llm-server/models/ModelCatalogRegistry.js`

Add-on models extensions contribute to the LLM Setup tab: downloadable entries,
usually bound to a runtime, that get a one-click "Download & set up" action.

## Methods

Extends [ContributionRegistry](../../shared/registry/ContributionRegistry.md)
(`register(entry, extensionId)`, `unregister`, `unregisterByExtension`,
`list`, `getById`, `extensions`).

- `ModelCatalogRegistry.shared` is the process-wide instance used by the
  add-on setup pipeline, the LLM IPC handlers and ExtensionManager.
- Validation: `entry.file.url` and `entry.file.filename` are required. Errors
  are prefixed `llmCatalog.registerModel:`.

Entry shape: `{ id, label, blurb?, licenseNote?, kind, requiresRuntime,
dir?, file: { url, filename, bytes?, sha256? }, contextLength?,
defaultContextSize?, sidecar? }`. `kind` is the models-scanner kind; the setup
pipeline installs `requiresRuntime`, downloads the file, then writes a sidecar
so the scanner can type it. Entries are stored as given; no defaults are added.
