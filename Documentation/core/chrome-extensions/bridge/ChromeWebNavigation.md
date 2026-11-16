# ChromeWebNavigation

`core/chrome-extensions/bridge/ChromeWebNavigation.js` (main process)

`chrome.webNavigation` for extensions: events sourced from every browser tab's
webContents and broadcast to the extension workers of that tab's session, plus
`getFrame` / `getAllFrames` answered from the live frame tree. Electron's own
`chrome.tabs.onUpdated` reports nothing for a navigation, which is why this
exists.

## Methods

- `new ChromeWebNavigation({ broadcast, webContents, webFrameMain })`:
  `broadcast(session, eventName, details)`; `webContents` and `webFrameMain`
  are Electron's modules (seams for tests).
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
`timeStamp`, `processId: -1`, `url`, `frameId` and `parentFrameId`. Only
webContents the TabViewManager knows as tabs emit; the shell, overlays and
extension pages stay silent.

## Frame ids

The main frame is 0 with parent -1. A subframe's id is its
`frameTreeNodeId`, and its parent is 0 or the parent frame's
`frameTreeNodeId`. That is the id Electron's own extension APIs use
(`chrome.scripting.executeScript({ target: { frameIds } })`,
`chrome.tabs.sendMessage(tabId, message, { frameId })`, a message sender's
`frameId`), so an id from here can be passed straight to them. The routing id
used before only matched by accident, and Bitwarden's script injection into
an iframe failed with `No frame with id N in tab with id M`. Events name a
frame by process and routing id, resolved with `webFrameMain.fromId`; an event
for a subframe that is already gone is not sent.
