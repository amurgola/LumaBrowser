# TabPinning

`core/browser/tab-view/TabPinning.js`

User-pinned tabs ("Pin tab"), Chrome style. A pinned tab (`entry.userPinned`) sits in the front block of the
strip after the app-pinned LLM tab (`entry.pinned`), renders as an icon only with no close button, is skipped
by Close other tabs / Close tabs to the right, and reopens at the next start even with "Restore tabs" off
([SessionTabs](SessionTabs.md)). Unlike the LLM tab it can still be closed (Ctrl+W, middle-click) and moved to
another window.

## Methods

- `new TabPinning({ registry, channel, lifecycle, emitter })`.
- `TabPinning.isFront(entry)` true for app-pinned and user-pinned tabs.
- `boundary(excludeId)` the order index right after the front block, counted with `excludeId` removed (the
  index `registry.move` inserts at).
- `setPinned(tabId, pinned)` regular browsing tabs only; flips the flag, moves the tab to the edge of the
  block (end of it when pinning, right after it when unpinning), rebroadcasts and emits `tabPinned`. Returns
  `{ success, pinned }`.
- `clampMove(tabId, toIndex)` keeps a drag inside its block: a pinned tab between the LLM tab and the end of
  the block, any other tab after it.

## Callers

`TabViewManager.setTabPinned` (IPC `tab-view:set-pinned`, `tabAPI.setPinned`), `moveTab` (clamps, and sends
`tab:moved` back when a drop was clamped so the strip's optimistic drop is undone) and `createTab` (a
`userPinned` tab without an index joins the block; a tab created with an index never lands inside it).
