# MonacoLoader

`core/llm-server/ui/js/monaco/MonacoLoader.js`

Lazily loads the vendored Monaco editor (about 5 MB parsed) once, on first use.

## Methods

- `MonacoLoader.ensureLoaded()` resolves `window.monaco`; every caller shares one
  promise. If `window.monaco.editor` already exists it resolves at once.
  Otherwise it appends `<script src="/llm-ui/lib/monaco/loader.js">` (Monaco's
  own browser AMD loader), configures `require.config({ paths: { vs:
  '/llm-ui/lib/monaco' } })`, requires `vs/editor/editor.main`, then defines the
  Luma theme ([MonacoThemes](MonacoThemes.md)) and diagnostics
  ([MonacoDiagnostics](MonacoDiagnostics.md)). Rejects with "Failed to fetch
  Monaco loader from ...", "Monaco loader exposed no AMD require()" or "Monaco
  loaded but window.monaco missing".
- `MonacoLoader.reset()` (tests only).

No `MonacoEnvironment.getWorkerUrl` is set: this build's worker files are hashed
per version and the AMD loader resolves them relative to the `vs` path.

## Where Monaco comes from

Monaco stays a vendor asset: `node_modules/monaco-editor/min/vs`, served at
`/llm-ui/lib/monaco/` by app/gateway/StaticUiRoutes (`LLM_UI_LIBS`) and by the
web backend (WebAppServer). Nothing is copied into the repo.

## Globals

Reads `window.monaco`, `window.require` (both set by the vendor loader).
