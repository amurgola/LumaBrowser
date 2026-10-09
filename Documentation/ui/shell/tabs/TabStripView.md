# TabStripView

`ui/shell/tabs/TabStripView.js`

The tab strip DOM: builds tab elements (CDP badge, favicon slot, title, persisted/audio flags, close button), places pinned and dashboard tabs, syncs each element with its entry, applies density classes and reads the strip order.

## Methods

- `ensureElement(entry, state)`, `refresh(entry)`, `refreshHost(host)`, `updateDensity()`, `setActive(id)`, `domOrder()`, `visibleIds()`, `applyOrder(order)`.
- `TabStripView.tabMarkup(entry, state)`.

## Globals

None.
