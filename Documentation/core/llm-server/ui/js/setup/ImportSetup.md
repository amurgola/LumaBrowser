# ImportSetup

`core/llm-server/ui/js/setup/ImportSetup.js`

The [setup pipeline](SetupPipeline.md) that adopts an LLM the user already has
(LM Studio, Hugging Face cache, Ollama) instead of downloading one.

## Methods

- `ImportSetup.run(api, { found, runtimeId, contextSize?, kvCacheType?, ...hooks })`:
  fails early with "No model selected to import." without `found.path`; ensures
  the runtime ([RuntimeEnsurer](RuntimeEnsurer.md)); "Adding your existing
  model…" calls `importExistingModel({ sourcePath, fileName })`; saves the
  defaults (context and KV type only when given) and starts the server
  idempotently. Resolves `{ ok: true, file, destPath, imported: true, mode }`.
  Fallback message: "Import failed".

## Globals

None.
