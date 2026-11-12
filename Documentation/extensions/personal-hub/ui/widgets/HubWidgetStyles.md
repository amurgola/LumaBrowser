# HubWidgetStyles

`extensions/personal-hub/ui/widgets/HubWidgetStyles.js`

The one stylesheet of the Hub's Dashboard widgets (focus, board, agenda,
activity feed), injected into the page once as
`<style id="hub-widget-styles">`. Themed off the shared design tokens in
`core/llm-server/ui/css/tokens.css` (imported by the Dashboard's `base.css`)
through short `--hub-*` aliases on `.hub-widget, .hub-settings-backdrop`
(the settings panel hangs off the document body, outside any widget, so it
needs the aliases itself), and follows
[the design system](../../../../ui/DesignSystem.md): neutral surfaces, sentence
case, the accent only for focus rings, the primary button, the drop target
lane, the drop marks, the agenda's now line and the focus view's current event time. Third-party colours (source chips, calendars,
tracker statuses, chat apps) show as small dots, never as stripes or filled
tags. `.cm-live-root.hub-widget` overrides the light live-module card surface
so the board, agenda and activity feed sit on the dark page. Every class
is prefixed `hub-`, apart from the settings page's `ext-*` and `luma-*`
helpers restyled inside the settings panel.

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
  `is-hidden` dimmed and dashed, `.hub-card-hide`; where a dragged card will
  land is an accent line, above the card with `is-drop-before` or at the end
  of `.hub-lane-body.is-drop-end`), `.hub-sync-error` (the `sync
  failed` marker in the bad colour; wraps inside `.hub-detail-meta`), pseudo
  lanes (`.hub-lane.is-pseudo` with a neutral dashed outline, a status pill
  head, `.hub-pseudo-note`, `.hub-pseudo-actions`, the `.hub-merge` select),
  the status picker (`.hub-picker-backdrop` over the widget, `.hub-picker`,
  `.hub-picker-title`, `.hub-picker-help`, `.hub-picker-list`,
  `.hub-picker-option`, `.hub-picker-actions`), `.hub-detail` (overlay) with
  `.hub-detail-meta` (label/value grid), `.hub-msg`, `.hub-compose`. Agenda: `.hub-day`, `.hub-event` (`.hub-event-bar` is the calendar colour as a dot), `.hub-now`. Activity feed:
  `.hub-feed-day` (sticky day heading), `.hub-feed-more`, `.hub-undo` (the
  undo bar, hidden while empty) with `.hub-undo-text`, `.hub-thread` and its
  parts (`is-dismissed` dimmed), `.hub-row-action` (quiet text actions that
  show with the row under the pointer or the keyboard inside it, and always
  on a dismissed row), `.hub-snapshot` (the conversation read from an item's
  tab: a bordered box on the sunken surface under the row; `is-note` is the
  small dim line shown while reading or when nothing was read) with
  `.hub-snapshot-from` (the muted line saying where it was read from) and
  `.hub-snapshot-text` (the text with its line breaks kept, long words
  wrapped, scrolling past 220px), `.hub-task-form` (the to-task selects and
  buttons) and `.hub-task-mark`. Summary cards, one per context: `.hub-sum-note` (the
  rules note), `.hub-sum-card` (`needs-you` draws an inset warning-colour
  edge on the left), `.hub-sum-top` with `.hub-sum-name` and
  `.hub-sum-updating` (muted italic), `.hub-sum-headline`, `.hub-sum-text`,
  `.hub-sum-needs` with `.hub-sum-reason`, `.hub-sum-asks` / `.hub-sum-ask`
  (a small bullet, `.hub-sum-ask-text`), `.hub-sum-error` (one muted line),
  `.hub-sum-actions` and `.hub-sum-items` (the card's rows on the sunken
  surface, full width). Focus: `.hub-focus` (the three stacked sections),
  `.hub-focus-label`, `.hub-focus-now` (a raised card; `is-empty` dashed
  and transparent) with `.hub-focus-title`, `.hub-focus-meta` and
  `.hub-focus-actions`, `.hub-focus-pick` (the task select), `.hub-need`
  and its parts (`.hub-need-main`, `.hub-need-title`, `.hub-need-reason`
  with a two-line clamp, `.hub-need-actions`; the dot is the bad colour for
  `k-task`, the warning colour for `k-task.is-today`, `k-context` and
  `k-item`, a context's own colour being set inline), `.hub-focus-quiet`,
  and `.hub-focus-cal` (`has-url` clickable, `is-now` with the time in the
  accent) with `.hub-focus-cal-when` and `.hub-focus-cal-title`. Head
  icon buttons: `.hub-icon-btn` (a 24px borderless square, muted until
  hovered, with a 15px icon) and `button.hub-link` (a link drawn on a
  button, as in the summary note). The settings panel
  ([HubSettingsPanel](HubSettingsPanel.md)): `.hub-settings-backdrop` (a
  fixed full-page scrim centring the dialog, with the widget's font and
  text colour and border-box sizing for everything inside), `.hub-settings`
  (the dialog on the pop surface, at most 820px wide and the page high),
  `.hub-settings-head`, `.hub-settings-notice` (good colour; `is-error` in
  the bad colour), `.hub-settings-body` (scrolling),
  `.hub-settings-pane[hidden]` and `.hub-settings-foot` (one muted line).
  The shared sections are written for the settings page, so the few of its
  layout helpers they use are defined inside `.hub-settings`:
  `.ext-form-row-inline` (a flex row whose `.luma-field-input` grows),
  `.ext-form-buttons--start`, `.ext-mt-8`, `.ext-mb-8` and the top margin
  of `.luma-section-label`.
