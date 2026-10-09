# WebviewAppBundler

`tools/ide/WebviewAppBundler.js`

Bundles the page's ES-module graph (with the markdown modules it imports) into one classic `app.js`, using core's [ModuleScriptBundler](../../core/llm-server/chat/ModuleScriptBundler.md); module URL paths map onto repo files.

## Methods

- `WebviewAppBundler.bundle(root, entry = WebviewAppBundler.ENTRY)`.
