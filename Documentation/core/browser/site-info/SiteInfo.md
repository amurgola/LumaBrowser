# SiteInfo

`core/browser/site-info/SiteInfo.js`

The site info popup's main side: what the active page's site may do and how to change it.

- **Connection:** https or not.
- **Permissions:** the remembered answers for camera, microphone, notifications and pop-ups, each Ask, Allow or Block.
  Ask forgets the answer (`SitePermissionStore.forget`).
- **Ad blocker:** a per-site off switch (`AdblockerService.setSiteAllowed`).
- **Cookies:** the site's cookies (domain the host or a parent of it), with a delete action that also clears the
  origin's storage.

The policies read the same stores, so a change applies at once; an ad blocker or data change reloads the page.

## Methods

- `new SiteInfo({ db, getTabViewManager, adblocker })`.
- `get(tabId)` -> `{ success, origin, host, secure, private, permissions, adblock: { available, on }, cookies }`
  (regular http(s) tabs only).
- `setPermission(tabId, kind, 'ask' | 'allow' | 'block')`, `setAdblock(tabId, off)`, `clearData(tabId)` ->
  `{ success, removed }`.
