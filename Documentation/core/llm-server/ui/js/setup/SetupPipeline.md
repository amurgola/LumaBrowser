# SetupPipeline

`core/llm-server/ui/js/setup/SetupPipeline.js`

Base class for the setup pipelines that both onboarding surfaces drive (the LLM
tab's Easy Setup and the first-run SetupWizard): [LlmSetup](LlmSetup.md),
[ImportSetup](ImportSetup.md), [ImageSetup](ImageSetup.md),
[MusicSetup](MusicSetup.md) and [AutoSetup](AutoSetup.md).

## Contract

- `run()` never throws. Every outcome is `{ ok: true, ... }`,
  `{ ok: false, canceled: true }`, `{ ok: false, paused: true }` (LLM download
  only) or `{ ok: false, message }`.
- `_validate()` returns an early failure for unusable input, or `null`.
- `_execute()` does the work (throws "<Class> must implement _execute()" in the
  base); a thrown error becomes `{ ok: false, message: err.message ||
  FAILURE_MESSAGE }`.
- `static FAILURE_MESSAGE` names the fallback message per pipeline.
- The constructor normalises the view hooks with [SetupHooks](SetupHooks.md);
  subclasses read them as `this._hooks`.

Every pipeline also has `static run(api, opts)` = `new X(api, opts).run()`.
Transport-agnostic: callers hand in llmDiagAPI-shaped adapters, so the LLM tab
passes `window.llmDiagAPI` and the shell wizard an ipcBridge adapter of the same
shape. The contract test is `SetupPipelineContract.test.js`.

## Legacy global -> module (`window.LumaSetupEngine`, `ui/js/setup-engine.js`)

| Legacy | Module |
|---|---|
| `LOREM` | `SpeedSimulator.LOREM` |
| `QUESTIONS` | `SetupQuestions.QUESTIONS` |
| `escapeHtml(s)` | `HtmlEscaper.escape(s)` |
| `fmtGB(b)` | `ByteFormatter.gb(b)` |
| `fmtRate(bps)` | `TransferText.rate(bps)` |
| `fmtEta(ms)` | `TransferText.eta(ms)` |
| `downloadSubText(p)` | `TransferText.downloadSubText(p)` |
| `quantTitle(q)` | `QuantText.title(q)` |
| `startSpeedSim(el, tk, stepMs)` | `SpeedSimulator.start(el, tk, stepMs)` |
| `pickImageRuntime(view)` | `ImageRuntimePicker.pick(view)` |
| `pickImageModel(catalog, hw)` | `ImageModelBudget.pickImageModel(catalog, hw)` |
| `cardBudgetBytes(hw)` | `ImageModelBudget.cardBudgetBytes(hw)` |
| `runLlmSetup(api, opts)` | `LlmSetup.run(api, opts)` |
| `runImportSetup(api, opts)` | `ImportSetup.run(api, opts)` |
| `runImageSetup(api, opts)` | `ImageSetup.run(api, opts)` |
| `runMusicSetup(api, opts)` | `MusicSetup.run(api, opts)` |
| `runAutoSetup(apis, opts)` | `AutoSetup.run(apis, opts)` |
| `startServerIdempotent(api)` | `ServerStarter.startIdempotent(api)` |
| `systemLibrariesProblem(system)` | `SystemLibraries.problem(system)` |
| `hardwareLine(hw)` | `HardwareText.hardwareLine(hw)` |
| `shortGpuName(raw)` | `HardwareText.shortGpuName(raw)` |
| `existingLibraryView(scan, opts)` | `ExistingLibraryView.view(scan, opts)` |
| `existingImageChoices(scan, plan)` | `ExistingImagePlan.choices(scan, plan)` |
| `planWithExistingImage(plan, found)` | `ExistingImagePlan.withExisting(plan, found)` |
| `mountAutoImageChoice(host, opts)` | `AutoImageChoice.mount(host, opts)` |
| `enableRamPin(llm, image)` | `RamPin.enable(llm, image)` |
| private `ensureRuntimeInstalled` | `RuntimeEnsurer.ensure` |
| private `hooks(opts)` | `SetupHooks.from(opts)` |
| private `EXISTING_SOURCE_LABEL` | `ExistingLibraryView.SOURCE_LABELS` |

Legacy kept `escapeHtml` and `fmtGB` as deliberate duplicates so the classic file could load in the shell without format.js; as modules the duplicates are gone.

## Globals

None.
