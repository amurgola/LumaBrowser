# PlacementGate

`core/placement/service/PlacementGate.js`

The test-render gate: a placed model may be allocated only once its footprint
is known.

## Methods

- `new PlacementGate({ servers, measuredStore, musicCatalog })`
  ([PlacementServers](PlacementServers.md), [MeasuredFootprintStore](MeasuredFootprintStore.md),
  anything with `getById(id)`).
- `canApply(layout)` true when every `PlacementLayout.placedItems(layout)` item
  has a model and a measured or stated footprint. An all-automatic layout passes;
  any throw fails.
- `measuredCurrent()` per item: the measured entry for its current model, else
  the stated footprint, else null.
- `statedFootprint(item)` `{ kind, modelKey, peakVramBytes, peakRamBytes: null,
  vramApprox: true, fromCatalog: true, ranAt: null }` for:
  - `music`: the catalog row's `minVramBytes` (both stages on one card);
  - `grounding`: `estimateVramBytes()` (files plus a fixed allowance);
  - null otherwise, or when unselected or not positive.

## Why

The test render only drives `generate_image` and `edit_image`, so a placed
music or grounding slot could never pass a measured-only gate.
