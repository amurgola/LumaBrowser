# ModelWizard

`core/llm-server/ipc/ModelWizard.js`

The onboarding wizard's hardware budget and model recommendation.

## Methods

- `new ModelWizard({ llmServerService, gather?, catalog? })` (defaults
  `SystemDiagnostics.gather`, `LlmRuntimeCatalog.shared`).
- `hardware(diagOut)` takes the service's persisted diagnostics snapshot (`ensureDiagnostics`, which
  re-probes only when a card changed) and falls back to a fresh gather (with the saved nvidia-smi path)
  when the service has no cache or it fails; returns `HwBudget.build(diag, { cudaRuntimePreference })`.
  `diagOut.diag` receives the raw snapshot when given.
- `recommend(answers)` resolves `{ hardware, recommendation: Recommender.recommend(hardware, answers || {}) }`.
