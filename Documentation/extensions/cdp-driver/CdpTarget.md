# CdpTarget

`extensions/cdp-driver/CdpTarget.js`

One CDP target; a page target is backed by one automation tab.

## Methods

- `new CdpTarget({ targetId, type, tabId, url, title, browserContextId })`; `attached` starts false.
- `toInfo()` -> `{ targetId, type, title, url, attached, browserContextId, canAccessOpener: false }`
  (`browserContextId` undefined when unset).
