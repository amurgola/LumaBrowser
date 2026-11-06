# PaletteHtml

`core/palette/ui/js/PaletteHtml.js`

Builds the search palette's markup from plain result data, all static. Every
value from the data is escaped; matched ranges become `<mark>`.

## Methods

- `list(groups, { query, canDig })`: group labels and rows, numbered across
  groups in keyboard order (`data-index`, `id="pal-row-<n>"`); an empty message
  when nothing matched; the "Dig deeper: ask about ..." row last when `canDig`.
- `row(item, index)`: kind icon, highlighted title, subtitle (with
  `subtitleMarks`), and a shortcut hint as keycaps or a tag on the right.
- `digRow(query, index)`, `empty(query)`.
- `icon(item)`: inline Lucide-style SVG per kind; pages and sections, Settings
  tabs and Setup pages share the page icon, image and video artifacts the image
  icon.
- `marked(text, marks)`: wraps `[start, end)` ranges, skipping bad or overlapping
  ones.
- `keys(combo)`: "Ctrl+Shift+T" as `<kbd>` keycaps.
- `esc(text)`.
