# StalePlacements

`core/placement/service/StalePlacements.js`

Finds the running models that sit somewhere other than where the saved layout puts them.

A layout is read when a model loads ([VramCoordinator](../../shared/runtime/VramCoordinator.md) `reserve`), so
saving one while a model is resident does not move it. Before this existed the canvas said "Saved." and the model
stayed on its old card with nothing on screen to say so: a chat model left on the smaller card ran at a seventh of
its speed until every model was stopped by hand. The canvas now lists these models
([PlacementStaleNotice](../../llm-server/ui/js/setup-ui/advanced/PlacementStaleNotice.md)) and can unload them
(`PlacementService.reloadStale`).

## Methods

- `StalePlacements.of(layout, slots)`: `slots` is the snapshot's `servers` map
  ([VramSnapshotBuilder](VramSnapshotBuilder.md)). Returns
  `[{ item, runningOn: [card], wants: [card], wantsRam }]` in layout item order.
- `StalePlacements.LIVE_STATES`: `ready`, `starting`, `loading`.

## Rules

- Only a live model counts, and only when its ledger claim names at least one card.
- An automatic item (no resource, or a dangling one) is never stale.
- A singularity's card decides where its members belong.
- A single card or an ordered group: stale when the model holds a card that is not in the resource. A group accepts
  any of its cards, so a model on the first card of a two card group is in place.
- System RAM: stale while the model still holds a card.
- A resource made only of peer GPUs is skipped (the local side is left to the default policy).
