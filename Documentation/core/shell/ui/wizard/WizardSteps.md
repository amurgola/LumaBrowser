# WizardSteps

`core/shell/ui/wizard/WizardSteps.js` (ES module)

Which steps the wizard shows and when each may continue.

## Methods

- `WizardSteps.build(state, enabledIds)` -> `[{ id, label }]`. Automatic:
  Start, Automatic Setup, Finish. Guided: Start, (switch: "Your models" LLM
  step first), Workflow, Features (Custom), LLM Provider (when an enabled
  extension needs an LLM, not for switch), Image Gen (once a workflow is
  picked), Webhook (notification-interceptor), Finish.
- `WizardSteps.isValid(stepId, state, enabledCount)`: persona, webhook and done
  always; auto when `auto.done`; workflow when picked; features when anything is
  enabled; llm when local setup is done, or remote has endpoint, key and model;
  image when resolved (done or skipped).

## Globals

None.
