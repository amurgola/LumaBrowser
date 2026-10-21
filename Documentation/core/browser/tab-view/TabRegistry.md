# TabRegistry

`core/browser/tab-view/TabRegistry.js`

The live tabs, their strip order and the active tab of each window. One order spans
every window; a window's strip is that order filtered to its tabs (`entry.hostId`).

## Methods

- Fields `tabs` (Map id -> [TabEntry](TabEntry.md)), `order` (ids in strip order).
- `activeTabId` (get/set): the main window's active tab. `activeIn(hostId)`,
  `setActive(hostId, tabId)` (null clears) for any window.
- `allocateId(kind)`: user and automation tabs count from 0, internal tabs from
  `TabKinds.INTERNAL_TAB_ID_BASE`.
- `add(entry, index)` inserts at the clamped `index`, else at the end; `remove(tabId)`.
- `get(tabId)` (null when unknown), `indexOf(tabId)`, `entries()`, `persisted()`.
- `list({ includeSilent, includeInternal, hostId })`: entries in strip order. Silent and
  hidden tabs are left out unless `includeSilent`, internal ones unless `includeInternal`;
  `hostId` narrows to one window.
- `inStrip(hostId)`: the tabs visible in one window's strip (every window's when left
  out), in order. `inHost(hostId)`: every tab drawn in one window.
- `neighbourOf(tabId)`: the strip tab to its right in the same window, else its left; the first strip
  tab when `tabId` is not in the strip. Chrome parity: the old behaviour jumped to
  the first tab in insertion order, which was always the pinned LLM tab.
- `move(tabId, toIndex)` -> `{ from, to }` (to clamped) or null.
- `findIdByWebContents(wc)`, `clear()`.
- `isActive(tabId)`: active in any window; checked by id alone, so it still answers
  while a closing tab is leaving the registry.
- `TabRegistry.notFound(tabId)`: the `{ success: false, error: 'Tab <id> not found' }` reply.
