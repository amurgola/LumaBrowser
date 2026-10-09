# TabPageEvents

`core/browser/tab-view/TabPageEvents.js`

Handles a tab page's non-navigation events.

## Methods

- `new TabPageEvents({ registry, channel, faviconCache, performAccelerator })`.
- `wire(entry)` installs:
  - `dom-ready`: injects `* { -webkit-app-region: no-drag !important; }`.
  - `render-process-gone`: reloads once after 250 ms; a second crash within 10 s
    shows the crash page. Clean exits, internal, silent and keep-alive tabs are
    left to their owners (the keep-alive sweep, the internal tab loader).
  - `before-input-event` (not for silent tabs): [Accelerators](../Accelerators.md)
    `.match`; on a hit the default is prevented, main-handled actions run through
    `performAccelerator`, and `{ action, tabId }` goes to `tab-view:accelerator`.
  - `found-in-page`: forwarded to `tab-view:found-in-page`.
  - `page-favicon-updated`: keeps http(s) and `data:image/` icons (`data:,` means
    none), and for regular browsing tabs records it in the FaviconCache, re-broadcasting
    when the cached data URL lands.
  - `console-message`: stored via [TabConsoleLog](TabConsoleLog.md) with `debug` as
    `verbose`; dropped while the tab is hidden.

## Why

Chromium applies `-webkit-app-region: drag` rects from every webContents attached
to the window to its hit-test, hidden views included. Sites with desktop titlebar
CSS (Slack, Discord, ClickUp, Teams) parked as keep-alive views would blanket the
tab strip with phantom drag regions, making the chrome silently unclickable.
Hidden persisted tabs' console chatter has no diagnostic value and would churn
the ring buffer.
