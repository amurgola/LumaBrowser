# Editor

`cli/lib/tui/editor/Editor.js`

The prompt editor at the bottom of the session: a multi-line text model (one string with `\n`
separators and a cursor offset), prompt history, a model-suggested follow-up, and the live slash
command palette.

## Members

- `new Editor({ theme, placeholder?, complete?, maxHistory = 200 })`: `complete(text)` returns palette
  entries (strings or `{ text, help, arg }`) or `null`.
- Fields: `text`, `cursor`, `history`, `historyIdx`, `label` (agent name in the top edge), `busy`
  (dims the box), `suggestion`, `completions` (`{ items, idx, base, rest, live }` or `null`), `theme`.
- `handleKey(k)`: [EditorKeymap](EditorKeymap.md), then refreshes the palette after an edit (not
  after a history step). Returns `{ consumed, submit?, changed? }`.
- `render(width)`: [EditorView](EditorView.md); `{ lines, cursor: { row, col } }`.
- `setText(t, cursorAtEnd?)`, `clear()`, `setSuggestion(t)`, `pushHistory(t)` (no blanks, no
  consecutive duplicates).
- Palette: `refreshPalette()`, `cycleCompletion(dir, step?)`, `acceptCompletion()`
  ([EditorPalette](EditorPalette.md)).
- Model helpers used by the keymap: `lineStart`, `lineEnd`, `insert`, `deleteRange`, `wordLeft`,
  `wordRight`, `moveVertical(dir)` (false at the edge), `historyMove(dir)` (walking past the newest
  restores the draft).
