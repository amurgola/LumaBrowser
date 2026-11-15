# webview-preload.js

`webview-preload.js` (root, CommonJS entry)

Preload of every web tab view. TabViewFactory creates web tabs sandboxed with
`contextIsolation: true`, and a sandboxed preload can require nothing but
`electron`, so this file is never loaded as is: at every boot
[TabSurfaces](app/browser/TabSurfaces.md) joins it and every local file it
requires into one self-contained `<data dir>/preload/tab-preload.js` with
[PreloadBundle](core/browser/tab-preload/PreloadBundle.md), and tabs load that
bundle. Nothing reachable from here may use Node APIs (`fs`, `path` and the
like are not available in the sandbox).

It is a thin entry: it builds a
[TabPreload](core/browser/tab-preload/TabPreload.md) with Electron's
`ipcRenderer`, `webFrame` and `contextBridge`, the page `window`, and the page
sources of [ChromeObjectShim](core/browser/ChromeObjectShim.md) and
[PasskeyShim](core/browser/PasskeyShim.md), and installs it. Its classes live in
`core/browser/tab-preload/`; an edit to any of them applies on the next start,
when the bundle is rewritten.
