# SessionTabs

`core/browser/tab-view/SessionTabs.js`

"Restore tabs on restart": records the regular strip tabs to [SessionTabList](SessionTabList.md) while the
`core.app.restoreTabs` preference is on, so the next launch can reopen them.

## Methods

- `new SessionTabs({ db, registry, emitter, setTimeoutFn?, clearTimeoutFn? })`. Listens on the
  TabViewManager for `tabCreated`, `tabClosed`, `tabHidden`, `tabMoved`, `tabSwitched`, `tabNavigated`
  and `tabTitleUpdated`, each calling `schedule()`.
- `isEnabled()`: the `core.app.restoreTabs` preference (false without a db or on a db error).
- `saved()`: the stored snapshot, or `null` when the preference is off or no tab was saved.
- `schedule()`: one `save()` `SAVE_DELAY_MS` (500 ms) later; nothing when sealed, already pending or off.
- `save()`: writes the snapshot when on, clears the stored snapshot when off. A db failure is a warning.
- `seal()`: cancels a pending save, saves now, then ignores every later change.
- Statics: `ENABLED_KEY`, `SAVE_DELAY_MS`, `EVENTS`.

The snapshot is the strip in order (`registry.inStrip()`), keeping only regular browsing tabs that are not
persisted and have a URL, plus the index of the active one among them (`-1` when none is).

## Why

Saving shortly after every change, not only at quit, means a crash still reopens the tabs. Persisted tabs are
left out because [PersistedTabs](PersistedTabs.md) restores them hidden in their partition; saving them here
too would open a duplicate. Teardown seals first (`TabViewManager.sealSession()` from `before-quit` and from
`destroyAll()`), so the shutdown's own tab closes never overwrite the strip the user left.
