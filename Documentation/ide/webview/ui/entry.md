# entry

`ide/webview/ui/entry.js`

The page's module entry: builds `new LumaPage(window.LumaToolGrammar)` and starts it. The IDE builds bundle this
graph (with the markdown modules it imports) into the one classic `app.js` both hosts load, using
[WebviewAppBundler](../../../tools/ide/WebviewAppBundler.md).

## Methods

- none (bootstrapper).

## Globals

Reads `window.LumaToolGrammar`.
