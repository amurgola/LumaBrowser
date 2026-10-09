# ListRowLedger

`core/browser/widgets/ListRowLedger.js`

Remembers every row [ListCollector](ListCollector.md) has seen.

## Methods

- `absorb(step)` records `step.items` (`{ key, order, fields }`) once per key and returns how many were
  new.
- `size`: rows seen. `virtualized`: true once a rendered row vanished between two steps (the list
  recycles DOM nodes).
- `rows()`: by the list's own `order` when every row has one, else by first sighting (scroll order).
