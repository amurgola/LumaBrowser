# webview-preload.js

`webview-preload.js` (root, CommonJS entry)

Preload of every tab view. TabViewFactory creates tab views with
`sandbox: false` and `contextIsolation: true`, so this preload may require
local files. It is a thin entry: it builds a
[TabPreload](core/browser/tab-preload/TabPreload.md) with Electron's
`ipcRenderer` and `webFrame`, the page `window`, and the page sources of
[ChromeObjectShim](core/browser/ChromeObjectShim.md) and
[PasskeyShim](core/browser/PasskeyShim.md), and installs it.

The path is unchanged (`app/browser/TabSurfaces` passes `<root>/webview-preload.js`).
Its classes live in `core/browser/tab-preload/`. Packaging: the preload and its
three classes must stay plain JS (bytecode skip list and asarUnpack), like the
two shims.
