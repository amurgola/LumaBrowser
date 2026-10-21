# ChromeWebNavigation

`core/chrome-extensions/bridge/ChromeWebNavigation.js` (main process)

`chrome.webNavigation` for extensions: events sourced from every browser tab's
webContents and broadcast to the extension workers of that tab's session, plus
`getFrame` / `getAllFrames` answered from the live frame tree. Electron's own
`chrome.tabs.onUpdated` reports nothing for a navigation, which is why this
exists.

## Methods

- `new ChromeWebNavigation({ broadcast, webContents })`:
  `broadcast(session, eventName, details)`; `webContents` is Electron's module
  (a seam for tests).
- `install(app, getTabViewManager)`: attaches to every webContents from
  `web-contents-created`; `getTabViewManager()` decides which ones are tabs.
- `attach(webContents)`: once per webContents (`_lumaWebNavigationBound`).
- `getFrame({ tabId, frameId })`, `getAllFrames({ tabId })`: frame infos
  (`frameId`, `parentFrameId`, `url`, `errorOccurred`, `documentLifecycle`,
  `frameType`) or `null` for an unknown tab.

## Event mapping

| webContents event | chrome.webNavigation event |
|---|---|
| `did-start-navigation` (not same-document) | `onBeforeNavigate` |
| `did-frame-navigate` | `onCommitted` (`transitionType: 'link'`) |
| `did-navigate-in-page` | `onReferenceFragmentUpdated` when only the hash changed, else `onHistoryStateUpdated` |
| `dom-ready` | `onDOMContentLoaded` (main frame) |
| `did-frame-finish-load` | `onCompleted` |
| `did-fail-load` | `onErrorOccurred` (`error`: the description) |

Details carry `tabId` (the webContents id, which is Electron's chrome tab id),
`timeStamp`, `processId: -1`, `url`, `frameId` (0 for the main frame, else the
frame's routing id) and `parentFrameId` (-1 for the main frame, else 0). Only
webContents the TabViewManager knows as tabs emit; the shell, overlays and
extension pages stay silent.
