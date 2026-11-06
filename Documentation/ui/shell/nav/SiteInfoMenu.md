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

## Methods

- `new SiteInfoMenu({ store, popupMenu, openSettings })`, `install()`, `open()`, `SiteInfoMenu.build(info, actions)`.
