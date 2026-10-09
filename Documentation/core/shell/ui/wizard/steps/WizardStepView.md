# WizardStepView

`core/shell/ui/wizard/steps/WizardStepView.js` (ES module)

Base of the wizard's step views.

## Methods

- `new <Step>(wizard)`.
- `enter()`: the step became current or the wizard re-rendered (default:
  `render()`); `render()`: repaints the step body (throws
  "<Class> must implement render()" in the base).
- Protected helpers: `_state`, `_body`, `_isCurrent(stepId)`.

## Globals

None.
