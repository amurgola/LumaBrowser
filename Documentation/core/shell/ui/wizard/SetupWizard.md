# SetupWizard

`core/shell/ui/wizard/SetupWizard.js` (ES module)

The first-run onboarding modal in the shell window. Non-dismissible
([ModalGuard](ModalGuard.md)). The first screen's persona picks the path:

| Persona | Path |
|---|---|
| chat | Automatic Local Setup, images off, no music question |
| create | Automatic Local Setup, images on, music question (not on a Mac) |
| build | Guided: Agent toolkit preset, LLM provider, Image, Webhook |
| tune | Guided: Custom features; lands on the LLM tab's Setup view |
| switch | Guided, LLM step first: existing-library scan with "Use this one" per model; lands on Setup with the launch plan expanded |

SetupWizard holds the [state](WizardState.md) and step navigation
([WizardSteps](WizardSteps.md)); each step is a
[WizardStepView](steps/WizardStepView.md): [PersonaStep](steps/PersonaStep.md),
[AutoStep](steps/AutoStep.md), [WorkflowStep](steps/WorkflowStep.md),
[FeaturesStep](steps/FeaturesStep.md), [LlmStep](steps/LlmStep.md),
[ImageStep](steps/ImageStep.md), [WebhookStep](steps/WebhookStep.md),
[DoneStep](steps/DoneStep.md). Finish is [WizardFinisher](WizardFinisher.md);
the IPC transports are [WizardApis](WizardApis.md). Installs run through the
shared setup pipelines (`core/llm-server/ui/js/setup/`).

## Public API (for the shell entry, C1)

- `new SetupWizard({ modalEl, onComplete })`: `modalEl` is `#setupWizardModal`
  (needs `#setupWizardBody`, `#setupWizardSteps`, `#setupWizardProgress`,
  `#setupWizardBackBtn`, `#setupWizardNextBtn`, `#setupWizardSkipBtn`);
  `onComplete()` runs after the wizard closes (legacy renderer.js then loaded the
  extension renderers and refreshed the license panel: now
  `uiSlotManager.loadExtensions(...)` and `uiSlotManager.refreshTelemetryPanel()`).
- `start()`: paints the first step at once (no IPC gates first paint) and loads
  the extension list in the background.

The legacy shell decided when to show it (`getSetupComplete()` false, or the
Settings "Re-run first-run setup" button through `window.__rerunSetupWizard`);
that stays in the shell entry.

## Methods the steps use

`state`, `extensions`, `extensionsReady`, `bodyEl`, `progressEl`, `backBtn`,
`nextBtn`, `skipBtn`, `step(id)`, `currentStepId()`, `steps()`,
`applyPersona(id, { silent })` (saves `core.persona` unless silent),
`applyWorkflow(presetId)`, `enabledExtensions()`, `isPlainCopy()`,
`musicOffered()`, `isCurrentStepValid()`, `rebuildSteps()`, `jumpTo(stepId)`,
`render()`, `renderSidebar()`, `renderFooter()`, `goBack()`, `goNext()`, `skip()`,
`finish()`, `addSpeedTimer(id)`, `clearSpeedTimers()`, `teardown()`.

## Behaviour

- Footer: Back hidden on the first step; Next reads Get Started, Continue or
  Finish Setup and is enabled only when the step is valid; Skip setup shows on
  every step but Finish. A local LLM, image or Automatic Setup install in flight
  disables Back and hides Skip.
- Skip setup asks `window.LumaModal.confirm` ("You can run setup later from the
  LLM tab.") and finishes with the defaults; without LumaModal it finishes at once.
- `teardown()` closes the modal, calls `onComplete` once, and cancels any
  download still running: the local LLM pane, the image pane, and Automatic
  Setup (both downloads; bug M17).

## Globals

Reads `window.ipcBridge` (invoke, on, getExtensions, getProviderConfigs,
saveProviderConfigs, fetchModelsForEndpoint), `window.electronAPI` (setPersona,
getSetupComplete, setSetupComplete, setDisabledExtensions, setWebhookUrlDirect,
saveWebhookUrl, getWebhookUrl, testWebhookDirect, testWebhook,
getAutoCheckUpdates, setAutoCheckUpdates, getApiPort, getMcpEnabled),
`window.llmSlotAPI` (getAllSlots, setSlotConfig), `window.LumaModal`,
`window.__LUMA_BOOT_START`, `navigator.platform`, `navigator.clipboard`
(through Clipboard). Writes none.
