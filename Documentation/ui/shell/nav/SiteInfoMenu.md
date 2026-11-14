# SiteInfoMenu

`ui/shell/nav/SiteInfoMenu.js`

Clicking (or Enter on) the lock or warning before the address opens the site info popup (a PopupMenu). Rows:

- the connection;
- Camera, Microphone, Notifications, Pop-ups and redirects, with the current answer (a click moves Ask, then Allow,
  then Block);
- "Block ads and trackers here" On / Off (disabled when the ad blocker is off everywhere);
- "Delete cookies and site data" with the cookie count;
- "All site settings" (Settings > Security & Sharing).

The menu re-opens after each change.

The popup belongs to the site it was opened on. When its tab moves to another origin while it is open (an agent or
a script driving the tab), `onNavigated` closes it, and every change sends the origin the popup was showing so
[SiteInfo](../../../core/browser/site-info/SiteInfo.md) refuses one that arrives after the move. A popup naming one
site can therefore never grant a permission to, or delete the data of, another.

## Methods

- `new SiteInfoMenu({ store, popupMenu, openSettings, host })`, `install()`, `open()`, `onNavigated(tabId, url)`
  (called by TabEventSync for the active tab), `SiteInfoMenu.build(info, actions)`, `SiteInfoMenu.originOf(url)`.
