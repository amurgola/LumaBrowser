# TabRegistry

`core/browser/tab-view/TabRegistry.js`

The live tabs, their strip order and the active tab id.

## Methods

- Fields `tabs` (Map id -> [TabEntry](TabEntry.md)), `order` (ids in strip order),
  `activeTabId`.
- `allocateId(kind)`: user and automation tabs count from 0, internal tabs from
  `TabKinds.INTERNAL_TAB_ID_BASE`.
- `add(entry, index)` inserts at the clamped `index`, else at the end; `remove(tabId)`.
- `get(tabId)` (null when unknown), `indexOf(tabId)`, `entries()`, `persisted()`.
- `list({ includeSilent, includeInternal })`: entries in strip order. Silent and
  hidden tabs are left out unless `includeSilent`, internal ones unless `includeInternal`.
- `inStrip()`: the tabs visible in the strip, in order.
- `neighbourOf(tabId)`: the strip tab to its right, else its left; the first strip
  tab when `tabId` is not in the strip. Chrome parity: the old behaviour jumped to
  the first tab in insertion order, which was always the pinned LLM tab.
- `move(tabId, toIndex)` -> `{ from, to }` (to clamped) or null.
- `findIdByWebContents(wc)`, `isActive(tabId)`, `clear()`.
- `TabRegistry.notFound(tabId)`: the `{ success: false, error: 'Tab <id> not found' }` reply.
