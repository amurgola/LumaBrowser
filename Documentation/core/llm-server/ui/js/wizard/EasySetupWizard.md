# EasySetupWizard

`core/llm-server/ui/js/wizard/EasySetupWizard.js`

"Easy Setup", the LLM tab's onboarding overlay over the Setup surface. A front door offers Automatic Setup ([AutoSetupFlow](AutoSetupFlow.md)) or the guided steps: use case, speed tolerance, context length ([GuidedSteps](GuidedSteps.md)), the recommendation with one-click install and download ([RecommendStep](RecommendStep.md), [LlmSetupFlow](LlmSetupFlow.md)), and optional image generation ([ImageStep](ImageStep.md)); then straight into chat.

## Methods

- `new EasySetupWizard({ getApi?, nav? })`: `getApi` returns llmDiagAPI (default `window.llmDiagAPI`); `nav` is a navigator-like object for the platform checks.
- `install()`: once, puts the "✨ Easy Setup" launch button into `#setupRoot .page-sub` and re-adds it whenever Setup re-renders (MutationObserver). Legacy did this at script load.
- `open()` (fresh [WizardState](WizardState.md)), `close()`, `goChat()` (close, then dispatch `luma-switch-mode` with detail `chat`), `startGuided()`, `render()`, `stepAnswered()`, `injectButton()`.
- Context for the step classes: `state`, `overlay`, `timers`, `autoFlow`, `isMac`, `api()`, `root()`, `imageApi()`, `musicOffered()`, `body()`, `setCloseDisabled(disabled)`.
- Guided footer: Back hidden on the welcome and image steps and once the LLM is installed; Next hidden on the action-driven steps 0, 4 and 5, disabled until the step is answered, and labelled "See recommendation" on step 3.

## Collaborators

The Setup surface (agent B1) renders `#setupRoot .page-sub`, where the launch button goes. Nothing else calls in; legacy exposed `window.LumaWizard = { open, close }`, which no other file read.

## Globals

Reads `window.llmDiagAPI` (default), `navigator`, `window.MutationObserver`; dispatches `luma-switch-mode` on window. Writes none (legacy wrote `window.LumaWizard`).
