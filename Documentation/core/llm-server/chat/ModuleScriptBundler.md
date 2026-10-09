# ModuleScriptBundler

`core/llm-server/chat/ModuleScriptBundler.js`

Turns a renderer ES-module graph into one classic script, for documents that
run with no server and no module loading (the conversation export opens from a
temp file). Used by [ConversationExportHtml](ConversationExportHtml.md).

## Methods

- `new ModuleScriptBundler({ readAsset, importMap? })`: `readAsset(urlPath)`
  returns a module's source; `importMap` is the page's `{ imports: { prefix: replacement } }`.
- `bundle(entryUrl)`: the script. Each module runs once, dependencies first,
  inside its own function scope:
  `__modules["<url>"] = (function () { const Dep = __modules["<dep url>"]; ...body...; return Class; })();`
  all wrapped in one strict IIFE.
- `resolve(spec, fromUrl)`: the URL path a specifier loads (relative URL
  resolution, then the longest matching import-map prefix).

## Scope

Only the renderer convention: `import Name from '<path>';` lines and
`export default class Name`. Any other `import`/`export` form throws
`unsupported module syntax in <url>`, and an import cycle throws
`import cycle at <url>`, so a graph is never bundled wrongly.
