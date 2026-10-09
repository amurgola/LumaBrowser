# AcceleratorTable

`ui/shell/keyboard/AcceleratorTable.js`

The browser's one shortcut table (action names shared with main, which forwards page-focused chords) and the keydown-to-action lookup. Cmd counts as Ctrl; shifted digits fall back to the physical key.

## Methods

- `AcceleratorTable.TABLE`.
- `AcceleratorTable.forEvent(e)` -> action or null.
- `AcceleratorTable.combo(e, key)`.

## Globals

None.
