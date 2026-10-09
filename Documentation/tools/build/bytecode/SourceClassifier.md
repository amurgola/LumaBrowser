# SourceClassifier

`tools/build/bytecode/SourceClassifier.js`

Decides, for every `.js` file of an app tree, whether the afterPack step may
compile it to main-process V8 bytecode or must ship it as plain JS. The plain
set is derived from the source, not from a hand-kept list, so a new preload,
worker or module cannot silently become a bytecode stub.

## Why files must stay plain

Bytecode is compiled inside an Electron main process and is only accepted by an
isolate with the same V8 flag hash. Anything that runs elsewhere dies on its
first line if it ships as a stub:

- renderer preloads (the bridged API is never exposed),
- worker_threads and utilityProcess entries (the worker exits on spawn),
- the stdio MCP server, run by the client's stock `node`,
- browser code: ES modules, classic page scripts, scripts read as text and injected into pages, and source that
  `ModuleScriptBundler` reads at runtime.

## Rules (first match is the reported reason)

| Reason | Rule |
|---|---|
| `electron-entry`, `dev-only`, `node-entry` | `main.js`, `jest.config.js`, `mcp-server.js` |
| `browser-dir` | any file under a `ui/` or `public/` folder (renderer modules, the PWA) |
| `es-module` | top-level `import`/`export` and no `module.exports` (EsModuleDetector) |
| `html-script` | a local `<script src>` of any HTML page (HtmlScriptScanner) |
| `manifest-ui` | a script an extension manifest serves to a page (ExtensionManifests.browserFiles) |
| `manifest`, `renderer-entry` | any `manifest.js` / `renderer.js` |
| `preload`, `worker` | file name matches `*preload.js` / `*worker.js` |
| `preload`, `worker`, `path-loaded` | loaded by file path (PathReferenceScanner): webPreferences preloads, Worker/utilityProcess/fork targets, injected scripts, page URLs such as `extensions/ext-ui.js` |
| `required-by:<root>` | everything a preload, worker, path-loaded file or node entry requires, transitively (RequireScanner) |
| `public-extension` | any file under `extensions/` outside a `private: true` extension folder |

Everything else is `main-process` and compiled. On the current tree that keeps
about 1,000 files plain and compiles about 1,900.

## Methods

- `new SourceClassifier(tree, { privateExtensionDirs, manifestBrowserFiles })`
  takes a [SourceTree](SourceTree.md) and what
  [ExtensionManifests](ExtensionManifests.md) reports.
- `classify()` returns `Map(rel -> { compile, reason })` for every `.js` file.
