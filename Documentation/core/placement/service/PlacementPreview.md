# PlacementPreview

`core/placement/service/PlacementPreview.js`

What Automatic Local Setup would do on an example PC, shaped for the placement canvas to draw.

It runs the planner the setup wizard uses ([AutoPlanner](../../llm-server/models/AutoPlanner.md)) with the real
chat and image catalogs against a [PreviewRigs](PreviewRigs.md) snapshot, through the same `HwBudget.build` and
`CudaDeviceProbe.readDevices` steps as [AutoSetupPlan](../../llm-server/ipc/AutoSetupPlan.md), with images wanted
and music not. Pure planning: nothing is saved, loaded or started, and the VRAM ledger is not touched.

## Methods

- `new PlacementPreview({ planner?, llmModels?, imageModels? })`: all three are test seams.
- `describe(rigId)` returns null for an unknown rig, else
  `{ rig: { id, label }, summary, snapshot, config: { layout, measuredCurrent, canApply: false } }`:
  - `summary`: the planner's own lines ([PlanSummary](../../llm-server/models/auto-plan/PlanSummary.md)), unchanged;
  - `snapshot`: the `getVramSnapshot` shape with the rig's one card and only the planned models available;
  - `config.layout`: a swap plan's own layout as is; otherwise the chat pick on the card (System RAM for a
    processor only pick) and the image pick on the card, or on System RAM when the plan is first come first served
    or the image model streams;
  - `config.measuredCurrent`: the VRAM the planner budgeted per pick (`llm.vramNeedBytes`, image minimum plus
    `ImageModelPicker.IMAGE_HEADROOM`), in the canvas's footprint shape. These are estimates, which the canvas
    banner says.

## Why

The canvas draws lanes only for cards this PC has, so there was no honest way to show what a smaller PC gets. The
planner is the same one a fresh install runs there, so its plan is what that PC would really be set up with. Video
is not part of Automatic Local Setup, so it is not in the preview.
