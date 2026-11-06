# DefaultBrowserIpcHandlers

`core/shell/default-browser/DefaultBrowserIpcHandlers.js`

`core.defaultBrowser.status` and `core.defaultBrowser.makeDefault` ([DefaultBrowser](DefaultBrowser.md)), registered by
CoreIpcRegistrar and answered for the browser chrome only. `DefaultBrowserIpcHandlers.run` is the execFile wrapper (15 s
timeout, hidden window).
