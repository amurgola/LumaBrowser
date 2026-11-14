# PreviewRigs

`core/placement/service/PreviewRigs.js`

The example PCs the placement canvas can preview a plan for, and the diagnostics snapshot each would report.

Every rig is one idle NVIDIA card plus an amount of system RAM. Single card rigs only: where each model lands on
one card follows from the plan alone, while a split over several cards is decided by the launch itself and cannot
be shown without running it. The list covers the three ways a plan shares one card (image streaming from RAM,
taking turns, both loaded).

## Methods

- `PreviewRigs.RIGS`: `{ id, label, card: { name, totalGB }, ramGB }` in menu order.
- `PreviewRigs.list()` returns `[{ id, label }]`.
- `PreviewRigs.byId(id)` returns the rig or null.
- `PreviewRigs.diagnostics(rig)` returns `{ cuda, memory, budget }` in the shape `SystemDiagnostics` gathers, with
  the budget from `ResourceBudget.compute`, so the usual VRAM and RAM reserves apply.
