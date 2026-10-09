# EditorPalette

`cli/lib/tui/editor/EditorPalette.js`

The editor's completion state.

## Methods (static)

- `lookup(editor, prefix)`: the editor's `complete(prefix)` entries normalised to `{ text, help, arg }`.
- `refresh(editor)`: while the text is one line starting with `/` and the cursor is at its end, the
  live palette lists the matching entries; the highlight is the exactly typed entry (`/agent` must not
  run `/agents`), else the one highlighted before, else the first. A tab-filled (not live) palette is
  left alone so cycling keeps its list.
- `cycle(editor, dir, step = true)`: fills the next entry into the text; a tab with nothing open
  starts a completion of the text before the cursor; on a live palette the first tab takes the
  highlighted entry as is.
- `accept(editor)`: enter with the palette open. A tab-filled entry submits as typed; a live palette
  runs the highlighted entry, or fills it in with a trailing space when it takes an argument (so the
  next word, such as an agent name, can be completed).
