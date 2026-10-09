# ImageRunner

`core/shell/ui/wizard/image/ImageRunner.js` (ES module)

Runs the image install through ImageSetup.

## Methods

- `run()`: needs a runtime and a model or linked checkpoint, else "No image
  runtime or model resolved for this host."; `ImageSetup.run(WizardApis.image(),
  { runtime, model, found, ... })`; success resolves the step, cancel reads
  "Image setup canceled. You can re-run this step from the Image tab later.".

## Globals

None.
