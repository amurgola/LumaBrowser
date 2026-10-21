# SignedOutNotice

`extensions/site-apis/runtime/SignedOutNotice.js`

The operating-system notification a run raises when it finds its site signed out; clicking it brings the site's
persisted tab to the front (`showSiteTab`). A copy of personal-hub's `DesktopAlert`, kept inside this extension
so the two do not depend on each other.

## Methods

- `new SignedOutNotice({ electronModule? })`: the module is a test seam; otherwise `electron` is required lazily,
  so outside the app `show` is a no-op answering false.
- `show({ title, body, onClick? })` -> whether a notification was shown. Shown notifications stay referenced
  until closed so the click handler survives.
