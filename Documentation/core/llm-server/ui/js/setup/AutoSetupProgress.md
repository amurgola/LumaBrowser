# AutoSetupProgress

`core/llm-server/ui/js/setup/AutoSetupProgress.js`

One progress bar across every download leg of an [AutoSetup](AutoSetup.md) plan.

## Methods

- `new AutoSetupProgress(legs, raw)`: `legs` is `[{ key, label, bytes }]` in run
  order (a linked checkpoint is not a leg); `raw` is the caller's
  [SetupHooks](SetupHooks.md).
- `pipelineHooks()` returns `{ isCanceled, onPhase, onBar, onSub }` to pass to a
  leg's pipeline.
- `beginLeg(key)`, `endLeg()` bracket each leg (an unknown key passes progress
  straight through).
- `phase(text)`: a phase starting with "Downloading" becomes
  "Downloading 2 of 3: image model (10 GB)".
- `setBar(fraction, subText, payload)`: the overall fraction is bytes done
  across legs. Outside a download the bar holds at the furthest point the leg
  reached; during a multi-leg download with a known rate the sub-line gains
  "overall about N min left".

## Globals

None.
