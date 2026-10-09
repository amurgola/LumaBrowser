# IdePageInliner

`tools/site-replays/IdePageInliner.js`

Assembles the IDE tool-window page as one self-contained HTML string, the way the JetBrains plugin's `LumaWebView.kt`
does: `luma.css` into the CSS placeholder, `cli/lib/tui/ToolGrammar.js` into the tool grammar placeholder and the
[WebviewAppBundler](../ide/WebviewAppBundler.md) bundle of `ide/webview/ui` into the app placeholder, each guarded
against an early closing script tag. The caller's bridge `<script>` (defining `window.__lumaSend`) goes right before
the page scripts. Paths come from [IdeWebviewFiles](../ide/IdeWebviewFiles.md).

## Methods

- `IdePageInliner.build(root, bridgeScript = '')`: the page HTML.
- `IdePageInliner.guard(source)`: escapes every closing script tag in a script's source.
