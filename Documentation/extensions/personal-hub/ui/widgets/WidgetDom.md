# WidgetDom

`extensions/personal-hub/ui/widgets/WidgetDom.js`

DOM and time helpers the Hub's Dashboard widgets share. Self-contained on
purpose: widget files are served to the Dashboard page alone
(`/llm-ui/ext/personal-hub/...`), so they import nothing from `ui-kit` or
`core`.

## Methods (static)

- `esc(value)`: HTML escaping for text and attributes.
- `el(tag, attrs, children)`: an element; `attrs` take `class`, `text`,
  `html`, `data` (dataset), `on` (listeners), `style`, and any attribute
  (`true` sets an empty attribute; `null`/`false` skip).
- `relativeTime(iso, now)`: `just now`, `5 min ago`, `3 h ago`, `2 d ago`;
  `''` when unparseable.
- `formatTime(iso)`, `formatTimeRange(start, end, allDay)` (`All day`,
  `09:30 to 10:00`), `formatDate(iso)` (`Oct 8`).
- `dayKey(iso, now)`: the local `YYYY-MM-DD` of a time (today when `iso` is
  null); `dayLabel(dayKey, now)`: `Today`, `Tomorrow`, else `Wed, Oct 8`.
