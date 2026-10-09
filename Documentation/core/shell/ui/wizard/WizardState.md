# WizardState

`core/shell/ui/wizard/WizardState.js` (ES module)

The wizard's selections and sub-flow state.

## Methods

- `WizardState.initial()` returns `{ persona, flow, auto, workflow,
  extensionOverrides (Map id -> enabled), llm { mode, type, endpoint, apiKey,
  selectedModel, models, local }, image, webhookUrl }`. The view machines:
  `auto.view` question | question-music | plan | progress | done | error;
  `llm.local.view` existing | questions | recommend | progress | done | error;
  `image.view` ask | recommend | progress | done | error.
- `WizardState.endpointFor(type)`: `https://api.anthropic.com` for anthropic,
  else `http://localhost:1234`; `ANTHROPIC_ENDPOINT`, `OPENAI_COMPAT_ENDPOINT`.

## Globals

None.
