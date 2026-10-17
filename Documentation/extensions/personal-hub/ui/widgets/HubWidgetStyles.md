# HubWidgetStyles

`extensions/personal-hub/ui/widgets/HubWidgetStyles.js`

The one stylesheet of the Hub's Dashboard widgets (board, agenda,
conversation queue), injected into the page once as
`<style id="hub-widget-styles">`. Themed off the shared design tokens in
`core/llm-server/ui/css/tokens.css` (imported by the Dashboard's `base.css`)
through short `--hub-*` aliases on `.hub-widget`, and follows
[the design system](../../../../ui/DesignSystem.md): neutral surfaces, sentence
case, the accent only for focus rings, the primary button, the drop target
lane and the agenda's now line. Third-party colours (source chips, calendars,
tracker statuses, chat apps) show as small dots, never as stripes or filled
tags. `.cm-live-root.hub-widget` overrides the light live-module card surface
so the board, agenda and conversation queue sit on the dark page. Every class
is prefixed `hub-`.

## Methods (static)

- `ensure(doc)`: appends the style element to the document head unless it is
  already there.
- `CSS`: the stylesheet. Shared pieces: `.hub-widget` (flex column filling the
  card, positioned for the detail overlay), `.hub-head`, `.hub-body`
  (scrolling), `.hub-chips` / `.hub-chip`, `.hub-seg`, `.hub-badge`,
  `.hub-count` (plain muted text), `.hub-dot` and `.hub-prio` (priority
  colours; only urgent and high are tinted), `.hub-btn`,
  `.hub-error`, `.hub-empty`, `.hub-swatch`, `.hub-toggle`, `.hub-status`
  (neutral tag with a `--hub-status` dot), `.hub-badge.hub-app` (neutral tag
  with a `--hub-app` dot), `.hub-avatar(s)`. Board: `.hub-lanes`
  (horizontal scroll), `.hub-lane` (240px minimum, `is-over`, `is-done`),
  `.hub-lane-add` and `.hub-target` (the `Add to` select, shown on focus or
  `is-busy`), `.hub-card` (the source is named in `.hub-card-where`; the
  `--hub-source` colour is set but only the filter chip swatch shows it;
  `is-hidden` dimmed and dashed, `.hub-card-hide`), `.hub-sync-error` (the `sync
  failed` marker in the bad colour; wraps inside `.hub-detail-meta`), pseudo
  lanes (`.hub-lane.is-pseudo` with a neutral dashed outline, a status pill
  head, `.hub-pseudo-note`, `.hub-pseudo-actions`, the `.hub-merge` select),
  the status picker (`.hub-picker-backdrop` over the widget, `.hub-picker`,
  `.hub-picker-title`, `.hub-picker-help`, `.hub-picker-list`,
  `.hub-picker-option`, `.hub-picker-actions`), `.hub-detail` (overlay) with
  `.hub-detail-meta` (label/value grid), `.hub-msg`, `.hub-compose`. Agenda: `.hub-day`, `.hub-event` (`.hub-event-bar` is the calendar colour as a dot), `.hub-now`. Queue:
  `.hub-thread` and its parts.
