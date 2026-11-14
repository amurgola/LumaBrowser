# PlacementPreviewMode

`core/llm-server/ui/js/setup-ui/advanced/PlacementPreviewMode.js`

The placement canvas's "what would another PC get" preview: a row of example PCs and, while one is picked, the
plan Automatic Local Setup would make there, drawn read-only under a banner.

While previewing, the [AdvancedView](AdvancedView.md)'s real `model` and `fit` are set aside and replaced with ones
built from the preview; leaving puts them back. Nothing is saved: the previewed canvas has no controls, its lanes
and tray take no pointer input, and Auto-arrange is disabled.

## Methods

- `new PlacementPreviewMode(view)`.
- `active`: true while an example PC is on the canvas.
- `load()`: reads the example PCs (`placement.previewRig(null)`). An app without that member offers no row.
- `picker()`: the `.adv-preview-rigs` row of `button[data-rig]` (empty id is "This PC", the current one has `.sel`),
  or null when there is nothing to offer.
- `describe()`: the `.adv-preview-banner` ("Preview: not this PC", the rig label, a note that sizes are estimates
  and nothing is saved) with the planner's lines in `.adv-preview-summary`. The banner is sticky, so it stays in
  view while the canvas scrolls.
- `show(rigId)`: fetches and draws a rig's plan, or returns to this PC for an empty id. A failed fetch leaves the
  canvas as it was and sets the status line.
- `leave()`: restores the real model and fit without rendering. Safe when not previewing.

## Globals

None.
