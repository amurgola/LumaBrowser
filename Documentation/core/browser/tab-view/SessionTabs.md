# SessionTabs

`core/browser/tab-view/SessionTabs.js`

"Restore tabs on restart": records the regular strip tabs to [SessionTabList](SessionTabList.md) while the
`core.app.restoreTabs` preference is on, so the next launch can reopen them. With it off only the
user-pinned tabs are recorded, and they reopen at every start.

## Methods

- `new SessionTabs({ db, registry, emitter, setTimeoutFn?, clearTimeoutFn? })`. Listens on the
  TabViewManager for `tabCreated`, `tabClosed`, `tabHidden`, `tabMoved`, `tabSwitched`, `tabNavigated`
  `tabTitleUpdated` and `tabPinned`, each calling `schedule()`.
- `isEnabled()`: the `core.app.restoreTabs` preference (false without a db or on a db error).
- `saved()`: the stored snapshot, or `null` when the preference is off or no tab was saved.
- `savedPinned()`: with the preference off, the stored tabs flagged `pinned`; `[]` when it is on.
- `schedule()`: one `save()` `SAVE_DELAY_MS` (500 ms) later; nothing when sealed, already pending or without a db.
- `save()`: writes the snapshot (only the pinned tabs when off, which also clears an old full snapshot). A db
  failure is a warning.
- `seal()`: cancels a pending save, saves now, then ignores every later change.
- Statics: `ENABLED_KEY`, `SAVE_DELAY_MS`, `EVENTS`.

The snapshot is the strip in order (`registry.inStrip()`), keeping only regular browsing tabs that are not
persisted and have a URL (each `{ url, title, pinned }`), plus the index of the active one among them (`-1`
when none is, and always `-1` for a pinned-only snapshot).

## Why

Saving shortly after every change, not only at quit, means a crash still reopens the tabs. Persisted tabs are
left out because [PersistedTabs](PersistedTabs.md) restores them hidden in their partition; saving them here
too would open a duplicate. Teardown seals first (`TabViewManager.sealSession()` from `before-quit` and from
`destroyAll()`), so the shutdown's own tab closes never overwrite the strip the user left.
