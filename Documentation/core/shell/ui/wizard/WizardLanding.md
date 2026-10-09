# WizardLanding

`core/shell/ui/wizard/WizardLanding.js` (ES module)

Where Finish takes the user.

## Methods

- `WizardLanding.call(state, hasLlm)` -> an `ipcBridge.invoke` argument list or
  null: `['core.llmServer.openChat']` after Automatic Setup;
  `['core.llmServer.openSetup']` for tune, `['core.llmServer.openSetup',
  { expand: 'plan' }]` for switch, when a local LLM is set up.

## Globals

None.
