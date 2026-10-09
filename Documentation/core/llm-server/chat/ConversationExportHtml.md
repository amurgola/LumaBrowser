# ConversationExportHtml

`core/llm-server/chat/ConversationExportHtml.js`

Assembles the self-contained export document from the share viewer page.

## Methods

- `ConversationExportHtml.build(data, { readAsset? })` reads `/share-view.html`
  and:
  1. reads its import map (`<script type="importmap">`) and removes it;
  2. replaces every absolute stylesheet link (`/llm-ui/css/...`, `/share-view.css`)
     with an inline `<style>`;
  3. removes the favicon link;
  4. replaces the module entry (`<script type="module" src="/js/share/entry.js">`)
     with `window.__LUMA_EXPORT__ = <data>` followed by ONE classic inline script:
     the entry's whole import graph bundled by
     [ModuleScriptBundler](ModuleScriptBundler.md) through the page's import map
     (any absolute classic script is inlined as it is). `</script` inside bodies
     is escaped;
  5. adds fixed-width print styles before `</head>`.
- `ConversationExportHtml.readAsset(rel)`: the default reader. `/llm-ui/x` reads
  `core/llm-server/ui/x`; anything else reads
  `core/network-sharing/webapp/public/x`. Injectable through `build` for tests.
- `ConversationExportHtml.scriptSafeJson(value)` is JSON safe to sit inside a
  `<script>` block: every `<` and the U+2028/U+2029 line terminators are written
  as JSON unicode escapes, so the result still parses to the same value.
- `ConversationExportHtml.PAGE_WIDTH` (900) is the document width the renderer
  also uses for its window.

## Why

Rendering with the same viewer as the public share link
([ShareView](../../network-sharing/webapp/public/js/share/ShareView.md) on the
chat's own chat.css and markdown modules) keeps a downloaded document identical
to the shared page and the chat it came from. The renderer opens the document
from a temp file, where module scripts cannot load their imports, so the module
graph is bundled into one classic script at export time; inlining the
projection and every asset makes the document need neither the web backend nor
a network listener, so export works with Network Sharing switched off.

`scriptSafeJson` is a reuse candidate for `core/shared` (any code that inlines
JSON into HTML needs it).
