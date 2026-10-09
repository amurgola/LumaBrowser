# ModelWizard

`core/llm-server/ipc/ModelWizard.js`

The onboarding wizard's hardware budget and model recommendation.

## Methods

- `new ModelWizard({ llmServerService, gather?, catalog? })` (defaults
  `SystemDiagnostics.gather`, `LlmRuntimeCatalog.shared`).
- `hardware(diagOut)` gathers fresh diagnostics (with the saved nvidia-smi path) and
  returns `HwBudget.build(diag, { cudaRuntimePreference })`; `diagOut.diag` receives
  the raw snapshot when given.
- `recommend(answers)` resolves `{ hardware, recommendation: Recommender.recommend(hardware, answers || {}) }`.
