# TabPage

`core/browser/tab-manager/TabPage.js`

One tab as the automation layer sees it: the entry's webContents and view, in-page script runs, and the action watcher.

## Methods

- `new TabPage(entry, tabId, tabViewManager)`; fields `entry`, `tabId`, `tabViewManager`; getters `webContents`, `view`.
- `url()`: the webContents URL.
- `run(script)`: `executeJavaScript(script, false)`.
- `runEnvelope(script, emptyError)`: for scripts answering `{ success: true, ...payload }` or
  `{ success: false, error }`. Returns `{ success: true, data: payload }` with the script's own
  `success` flag stripped, or `{ success: false, error }`; an empty answer reads `emptyError`
  (default `NO_RESULT_ERROR`, `In-page script returned no result`). Throws propagate.
- `watchAction()`: a new [ActionWatcher](../ActionWatcher.md) on this tab. Call it BEFORE the action.

## Why

The flag is stripped so a consumer never sees `data.success` next to the envelope's `success` and has to guess which one means the action worked.
