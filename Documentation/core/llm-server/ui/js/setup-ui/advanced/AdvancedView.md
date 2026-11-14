# AdvancedView

`core/llm-server/ui/js/setup-ui/advanced/AdvancedView.js`

The LLM tab's Advanced view. Its Model Placement sub-tab is one drag-and-drop
canvas: drag the model chips (LLM, image generate, image edit, video, music,
grounding, and an optional split-out LLM context) onto a single GPU lane, an
ordered GPU group (fill the first card, overflow to the next), a singularity
(members share one card, one loaded at a time) or System RAM; anything left in
the Automatic tray is placed by the coordinator. Allocation is gated on a test
render, and lane bars are sized from measured footprints, never estimates. The
Server Info sub-tab holds the diagnostics cards (filled by the Setup load) and
the Data sub-tab the chat data wipe.

State and arithmetic: [PlacementLayoutModel](PlacementLayoutModel.md),
[PlacementFit](PlacementFit.md), [LlmSplit](LlmSplit.md), [RemoteRefs](RemoteRefs.md),
[PlacementItems](PlacementItems.md), [PlacementText](PlacementText.md).
Rendering: [PlacementRows](PlacementRows.md), [PlacementLanes](PlacementLanes.md),
[PlacementChips](PlacementChips.md), [DropTargets](DropTargets.md),
[SplitEditorPanel](SplitEditorPanel.md), [PlacementControls](PlacementControls.md),
[TestRenderPanel](TestRenderPanel.md), [TestRenderTables](TestRenderTables.md),
[PromptPreviewPanel](PromptPreviewPanel.md), [AdvancedStyles](AdvancedStyles.md).
Sub-tabs: [AdvancedSubtabs](AdvancedSubtabs.md), [ChatDataWipe](ChatDataWipe.md).
Example PC preview: [PlacementPreviewMode](PlacementPreviewMode.md).

## Methods

- `new AdvancedView({ api, doc?, reload? })`: `api` is `window.llmDiagAPI`
  (`.placement`, `.chat`, `.artifact`, `.conv` are read lazily); `reload` is
  what the chat data wipe calls (default `location.reload`).
- `init()`: wires the sub-tab strip and the Data tab (idempotent). The Advanced
  nav button is always visible, so [SetupMain](../SetupMain.md) calls it at start.
- `open()`: the lazy init run each time the view is shown (the navigator's
  `openers.advanced`): applies the current sub-tab, injects the styles, wires
  Auto-arrange, loads the config and VRAM snapshot, renders. Without a placement
  API the body reads "Placement API unavailable."
- `render()`: the example PC row, then gate, context row, split editor, Automatic
  tray, combine row, lanes, chips, controls, test render, prompt preview. While an
  example PC is previewed it draws only the row, the preview banner, the tray, the
  lanes and the chips, adds `adv-previewing` to `#advBody` and disables
  `#advAutoArrange`. `open()` always returns to this PC.
- Canvas actions used by the renderers: `drop(itemKey, target)`,
  `setContextSplit(enabled)`, `createGroup(devices)`, `ungroup(id)`,
  `reorder(id, from, to)`, `addSingularity(resId)`, `removeSingularity(id)`,
  `openSplitEditor()`, `closeSplitEditor()`, `applySplit()`, `refreshSnapshot()`,
  `status(text)`, `placementApi()`, `artifactApi()`. Fields `model`, `fit`.

## Globals

Reads `document` (`#advancedRoot`, `#advSubtabs`, `#advBody`, `#advAutoArrange`,
`#pageTitle`, `#chatDataWipe`, `#chatDataStatus`); writes a `<style id="adv-styles">`
into `<head>`. No `window` globals.

## Scroll position across a redraw

`render()` rebuilds the whole body. It holds the body at its current height (an inline `min-height`) until the
rebuild is done, so the page does not scroll back up under the pointer each time a chip is dropped or an example PC
is picked. A preview is shorter than the real canvas, so `.adv-previewing` keeps a `min-height` of the viewport.
