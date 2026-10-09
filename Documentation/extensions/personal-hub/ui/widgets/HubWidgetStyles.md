# HubWidgetStyles

`extensions/personal-hub/ui/widgets/HubWidgetStyles.js`

The one stylesheet of the Hub's Dashboard widgets (board, agenda,
conversation queue), injected into the page once as
`<style id="hub-widget-styles">`. Themed off the Dashboard's dark tokens
from `base.css` (`--text`, `--border`, `--surface-*`, `--accent*`, `--good`,
`--warn`, `--bad`) through `--hub-*` aliases on `.hub-widget`, each with a
fallback for a page without them; `.cm-live-root.hub-widget` overrides the
light live-module card surface so the board, agenda and conversation queue
sit on the dark page. Every class is prefixed `hub-`.

## Methods (static)

- `ensure(doc)`: appends the style element to the document head unless it is
  already there.
- `CSS`: the stylesheet. Shared pieces: `.hub-widget` (flex column filling the
  card, positioned for the detail overlay), `.hub-head`, `.hub-body`
  (scrolling), `.hub-chips` / `.hub-chip`, `.hub-seg`, `.hub-badge`,
  `.hub-count`, `.hub-dot` and `.hub-prio` (priority colours), `.hub-btn`,
  `.hub-error`, `.hub-empty`, `.hub-swatch`, `.hub-toggle`, `.hub-status`
  (tinted from `--hub-status`), `.hub-avatar(s)`. Board: `.hub-lanes`
  (horizontal scroll), `.hub-lane` (240px minimum, `is-over`, `is-done`),
  `.hub-lane-add` and `.hub-target` (the `Add to` select, shown on focus or
  `is-busy`), `.hub-card` (left accent from `--hub-source`, `is-hidden`
  dimmed and dashed, `.hub-card-hide`), `.hub-sync-error` (the `sync
  failed` marker in the bad colour; wraps inside `.hub-detail-meta`), pseudo
  lanes (`.hub-lane.is-pseudo` dashed in the accent colour, a status pill
  head, `.hub-pseudo-note`, `.hub-pseudo-actions`, the `.hub-merge` select),
  the status picker (`.hub-picker-backdrop` over the widget, `.hub-picker`,
  `.hub-picker-title`, `.hub-picker-help`, `.hub-picker-list`,
  `.hub-picker-option`, `.hub-picker-actions`), `.hub-detail` (overlay) with
  `.hub-detail-meta` (label/value grid), `.hub-msg`, `.hub-compose`. Agenda: `.hub-day`, `.hub-event`, `.hub-now`. Queue:
  `.hub-thread` and its parts.
