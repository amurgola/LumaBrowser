# TabForeground

`extensions/cdp-driver/domains/TabForeground.js`

A WebContentsView only paints while visible, so a screenshot needs its tab in front.

## Methods

- `new TabForeground(browser)`.
- `bringForward(tabId)`: remembers the active tab and, if different, switches (best
  effort) and waits 50 ms for a paint.
- `restore(tabId)`: switches back only if it switched and there was another tab.
