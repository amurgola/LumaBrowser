# PopupGate

`core/browser/tab-view/PopupGate.js`

The popup blocker. A regular browsing tab may open a new tab or window only within 5 s of the user clicking,
tapping or typing in it (Chromium's transient activation window), or when its origin's `popups` answer in the
SitePermissionStore is `allow`. Agent, internal and automation tabs are never gated.

## Methods

- `new PopupGate({ sites, channel, now })`: `sites` is a SitePermissionStore, `channel` the TabStateChannel;
  `now()` is injectable for tests.
- `wire(entry)` records activating `input-event`s (mouse down/up, key down, char, touch, tap, pointer down/up;
  not moves, wheels or scrolls) as `entry.lastUserInputAt`, and clears the blocked list on `did-navigate`.
- `allows(entry)` the verdict for an open from this tab.
- `siteAllowed(url)` whether the URL's origin has pop-ups allowed.
- `block(entry, url)` remembers a refused open on `entry.blockedPopups` (`[{ url }]`, newest last, at most
  `MAX_BLOCKED` = 20) and rebroadcasts the tab.
- `clear(entry)` empties the list.
- `take(entry, index)` removes one blocked open and returns its URL (null for a bad index or a blank popup).
- `allowSite(entry)` stores `popups: allow` for the tab's origin, empties the list and returns
  `{ success, urls }` with the non-blank URLs to open.

## Why

Electron has no popup blocker of its own: every `window.open` reaches `setWindowOpenHandler`, so pages that
open tabs on load or on timers went through unchecked. `input-event` also fires for `sendInputEvent`, so the
agent's trusted clicks (InputDriver) count as user input.
