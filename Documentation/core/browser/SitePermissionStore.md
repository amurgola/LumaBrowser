# SitePermissionStore

`core/browser/SitePermissionStore.js`

Remembered per-origin answers for camera, microphone, pop-ups and notifications, stored in the settings db
under `core.permissions.sites` as `{ [origin]: { camera?, microphone?, popups?, notifications? } }`, each
`'allow'|'block'`.

## Methods

- `new SitePermissionStore(db)`; `db` is the settings db (`get(key, fallback)`, `set(key, value)`)
  or null, in which case nothing is remembered or written.
- `answerFor(origin, kind)` returns `'allow'`, `'block'`, or null.
- `remember(origin, kinds, value)` merges `value` for each kind into the origin's row.
- `list()` rows `{ origin, camera, microphone, popups, notifications }` sorted by origin, unset kinds as null.
- `SitePermissionStore.KINDS` the kinds `list()` reports.
- `clear(origin)` removes one origin; returns whether it existed.
- `clearAll()` empties the store.
- `SitePermissionStore.SITES_KEY` the settings key.

A stored value that is not an object reads as empty.
