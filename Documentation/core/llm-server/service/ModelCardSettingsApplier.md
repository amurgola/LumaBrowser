# ModelCardSettingsApplier

`core/llm-server/service/ModelCardSettingsApplier.js`

After a model is downloaded from the Hub, fills the sampler settings its repo
recommends into that model's own settings.

`apply({ repoId, filePath | modelRef })` resolves `{ found, applied, kept,
source, sourceRepo, modelRef }`. Only fields the model has no value for are
filled in (`ModelSettings.applySuggested`); nothing found is `{ found: false }`
and the app's defaults stand. Best effort: errors are reported in the result,
never thrown.

`ModelFileDownloader` calls it once a GGUF from the Hub is down and sends a
`settings` model event when anything was applied.
