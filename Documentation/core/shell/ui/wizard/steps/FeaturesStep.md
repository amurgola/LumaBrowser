# FeaturesStep

`core/shell/ui/wizard/steps/FeaturesStep.js` (ES module)

Custom's Features step: a switch per installed non-debug extension, with missing required dependencies and the version, plus a switch per catalog add-on not installed yet ("Downloads when you finish"), all sorted by name. The add-on rows appear when the catalog answers (`addonsReady`); offline there are none.

## Methods

- `render()`: "Loading feature list…" until the background list arrives; a switch writes the override and rebuilds the steps.

## Globals

None.
