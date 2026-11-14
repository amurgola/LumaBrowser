# PlacementStaleNotice

`core/llm-server/ui/js/setup-ui/advanced/PlacementStaleNotice.js`

The placement canvas's notice for models the saved layout would move. It sits under the allocation gate, above
the lanes, and reads "Saved, not applied yet." with one line per model: where it is running and where the saved
layout puts it. The list is the snapshot's `stale`
([StalePlacements](../../../../../placement/service/StalePlacements.md)); with none, nothing is drawn.

"Unload to apply" calls `placement.reloadStale()`, which unloads only those models, re-reads the snapshot and
reports what was unloaded in the status line. Each model loads again, in its saved place, the next time it is used.
Nothing is unloaded without that click, because an unload ends a reply or a render that is in progress.

## Methods

- `new PlacementStaleNotice(view)`: the [AdvancedView](AdvancedView.md).
- `entries()`: the snapshot's stale list (empty for a preview or an older main process).
- `build()`: the notice element, or null.
- `reload(button)`: the button's action.
- `PlacementStaleNotice.describe(entry)`, `cards(indexes)`, `resultText(reply)`: the wording.
- `PlacementStaleNotice.SAVED_HINT`: appended to "Saved." by [PlacementControls](PlacementControls.md) when the
  save left a running model behind.

## Globals

None.
