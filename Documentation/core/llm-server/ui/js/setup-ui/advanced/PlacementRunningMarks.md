# PlacementRunningMarks

`core/llm-server/ui/js/setup-ui/advanced/PlacementRunningMarks.js`

Marks on the card lanes for where each loaded model really is.

A chip shows where the layout wants a model. That says nothing for an automatic model, whose chip stays in the
Automatic tray while it is loaded on some card, or for a model still on its old card after a layout change. So for
every live model (`ready`, `starting`, `loading`) a dashed, non-draggable mark "running here" (or "loading here",
with ", partly in RAM" for a RAM offload) is drawn in the lane of each card its ledger claim names, unless the
model's own chip already sits in that lane. A card that belongs to an ordered group marks the group's lane, once.

The cards come from the snapshot's `servers[item].devices`
([VramSnapshotBuilder](../../../../../placement/service/VramSnapshotBuilder.md)), which is the planned claim. The
snapshot is read when the view opens, after a save and after Start all, Stop all or "Unload to apply"; the marks
do not follow a model that loads while the canvas is left open. Marks are hidden in an example PC preview.

## Methods

- `new PlacementRunningMarks(view)`: the [AdvancedView](AdvancedView.md).
- `distribute(root)`: adds the marks to the lanes under `root`.
- `mark(item)`: one mark element (`.adv-running`, `data-running` is the item key).

## Globals

None.
