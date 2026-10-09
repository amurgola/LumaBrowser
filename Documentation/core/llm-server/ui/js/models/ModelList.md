# ModelList

`core/llm-server/ui/js/models/ModelList.js`

The one renderer for the LLM "Models Directory" and the Image "Image Models" lists. It mounts the shared [mlRow](../resonant/ResonantTemplates.md) template under a reactive namespace, owns collapse and expand, and routes row button clicks and control changes to the section's adapter. Domain-agnostic: each section builds row view objects (the mlRow contract) and feeds them through the returned [ModelListController](ModelListController.md).

## Methods

- `ModelList.mount(mountEl, ns, opts?)` returns a `ModelListController` (or `null` without a mount). Idempotent per element. `mountEl` is the STABLE container (never innerHTML-cleared); a hidden `<div res="ns" res-use="mlRow">` is appended and Resonant renders rows as its siblings. `opts`: `onAction(row, act, event, btn)` for a click on a `[data-ml-act]` button, `onChange(row, control, event)` for a change on `[data-ml-change]` or `.img-quant-sel` (the row is found by the element's `data-key` or `data-id`), `libraryScan` (`false`, `true` or [LibraryScan](LibraryScan.md) options; the `mlLlmRows` list gets it unless `false`), `resonant` (defaults to `ResonantRuntime.shared()`).
- `ModelList.mountLibraryScan(mountEl, opts)`: the scan action on its own (`LibraryScan.mount`).
- The head click (`res.mltoggle`) flips `expanded`, except when the click lands on a button, link, select, input or label inside the head. `Resonant.add` runs once per namespace per instance.
- `LLM_LIST_NS = 'mlLlmRows'`.

## Globals

Reads `window.Resonant` through ResonantRuntime. The shared Resonant instance binds to window, so the framework itself defines `window[ns]` for each namespace (`mlLlmRows`, `mlLlmAddon`, `mlImgInstalled`, `mlImgCatalog`); this class reads the arrays from `resonant.data`, not from window. Dispatches nothing itself.

## Notes

Row markup is unchanged: the template lives in ResonantTemplates.ML_ROW. Resonant applies array updates on a `setTimeout`, so a structural refresh paints on the next tick.
