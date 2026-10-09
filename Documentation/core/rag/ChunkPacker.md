# ChunkPacker

`core/rag/ChunkPacker.js`

Packs the unit groups from [BlockUnitizer](BlockUnitizer.md) into chunk
windows. A window is a run of units covering one contiguous span no longer than
the [ChunkBudget](ChunkBudget.md).

## Methods

- `new ChunkPacker(budget)`.
- `pack(groups)` returns windows, each a non-empty array of units in source
  order.

## Rules

1. A group that opens a section closes the open window once it holds at least
   `sectionFloorChars`; smaller windows absorb the new section.
2. A group that fits the open window joins it.
3. Otherwise, if the group fits a window of its own and the open window is past
   the floor, the open window closes and the group moves whole.
4. Otherwise the group's units are placed one by one, closing windows as they
   fill (a large block splits only between its units).
5. When a window closes inside a section, the next one opens with the longest
   tail of whole, non-heading units of the closed window that fits
   `carryChars` (never the entire window). No carry crosses into a new section,
   and the carry is dropped if it would push the next unit over the budget.

## Why

Moving blocks whole keeps paragraphs, code and tables intact whenever the
budget allows; carrying whole units keeps the overlap readable and lets a fact
near an edge be found from either side.
