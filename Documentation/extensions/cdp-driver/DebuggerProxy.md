# DebuggerProxy

`extensions/cdp-driver/DebuggerProxy.js`

Wraps each automation tab's `webContents.debugger`. CDP tabs hold the debugger
exclusively, so there is no refcount. An EventEmitter.

## Methods

- `new DebuggerProxy(browserService)`; webContents come from
  `getTabManager().tabViewManager.getEntry(tabId).webContents`.
- `attach(tabId)`: once per tab; attaches protocol `1.3` if needed and re-emits every
  Chromium message as `event:<tabId>` with `{ method, params }`. Cleans up when the
  webContents is destroyed.
- `sendCommand(tabId, method, params)`: attaches on first use; `params` default `{}`.
- `detach(tabId)`, `detachAll()`, `isAttached(tabId)`.
- Unknown tabs throw `No webContents for tab <id>`.
