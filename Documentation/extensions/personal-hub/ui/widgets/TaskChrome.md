# TaskChrome

`extensions/personal-hub/ui/widgets/TaskChrome.js`

The small pieces the board widget and its task detail draw the same way: the
tracker status pill in the tracker's own colour, assignee initials, the
per-source accent colours and a few inline icons. Listed in the manifest's
`dashboard.assets`. Only a hex colour ever reaches a style attribute.

## Members (static)

- `LOCAL` (`'local'`), `LOCAL_COLOR`, `SOURCE_PALETTE` (six colours distinct
  on the dark page, never the accent orange that marks UI state),
  `MAX_AVATARS` (3), `ICONS` (`hide`, `show`, `open`, `close` SVGs).
- `sourceKey(task)`: the task's `sourceId`, else `LOCAL`.
- `sourceColors(tasks)` -> `{ sourceKey: color }`: sources in label order take
  the palette in turn, so a source keeps its colour between paints; `LOCAL`
  gets `LOCAL_COLOR`.
- `safeColor(value, fallback = '')`: the value when it is a hex colour, else
  the fallback.
- `statusPill(task)`: a `.hub-status` span with `remoteStatus`, coloured
  through `--hub-status` from `remoteStatusColor`; `null` for a local task.
- `names(assignees)`: display names from `{ id, name }` objects (else `email`
  or `id`); plain strings from older rows still read.
- `initials(name)`: two letters (first and last word, or the first two of a
  single word; an email's domain dropped), `?` when empty.
- `avatars(assignees)`: up to `MAX_AVATARS` `.hub-avatar` initials plus
  `+N`, titled with every name; `null` without assignees.
- `icon(name)`: an inline-flex span holding one of `ICONS`.
