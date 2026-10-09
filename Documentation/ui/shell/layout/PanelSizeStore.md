# PanelSizeStore

`ui/shell/layout/PanelSizeStore.js`

Persists dragged panel sizes in localStorage (`lumabrowser.panelSizes.v1`) and re-applies them as CSS variables.

## Methods

- `read()`, `write(sizes)`, `remember(storeKey, px)`, `applyStored(panels)` (all static).

## Globals

Reads and writes `localStorage`.
