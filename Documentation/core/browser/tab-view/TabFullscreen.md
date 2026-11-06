# TabFullscreen

`core/browser/tab-view/TabFullscreen.js`

Page fullscreen (a video's full-screen button, `element.requestFullscreen`). On `enter-html-full-screen` the window goes
full screen and the tab's view covers the whole window (`TabLayout.setFullView`, re-applied on resize). On
`leave-html-full-screen`, Esc (TabPageEvents), or switching tabs in that window, the view returns to the content area.
The window then leaves full screen unless it was already full screen (F11) before. The chrome hears
`tab-view:page-fullscreen` `{ tabId, on }`.

## Methods

- `new TabFullscreen({ registry, hosts, layout, channel })`, `wire(entry)`, `enter(entry)`, `leave(entry)`,
  `exitPage(entry)` (also tells the page to exit), `isFullscreen(entry)`, `onSwitched(hostId)`.
