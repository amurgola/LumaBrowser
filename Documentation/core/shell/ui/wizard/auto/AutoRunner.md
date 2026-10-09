# AutoRunner

`core/shell/ui/wizard/auto/AutoRunner.js` (ES module)

Runs the plan through AutoSetup and mirrors the outcome into the guided state.

## Methods

- `run({ resumeFrom })`: `AutoSetup.run(WizardApis.all(), { plan, resumeFrom,
  priorFile, ... })`. Success: model file and name, image result, done; the LLM
  step counts as done locally, the image step as resolved (skipped without an
  image leg). Failure: error (cancel: "Setup canceled. Your download progress
  is saved; try again to resume."), failedStep, sysdeps.

## Globals

None.
