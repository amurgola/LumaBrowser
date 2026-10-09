# ExistingLlmModels

`core/llm-server/ipc/ExistingLlmModels.js`

Adopts GGUF models the user already has (LM Studio, the Hugging Face cache,
Ollama) instead of downloading them again.

## Methods

- `new ExistingLlmModels({ llmServerService, modelsView, scanner?, importer? })`
  (defaults `ExistingLibraryScanner`, `ExistingModelImporter`).
- `scan()` `{ models, sources }` against the models folder.
- `adopt({ sourcePath, fileName })` links the file in; a refusal is returned as is,
  a success gets a fresh decorated `scan` so the model is pickable everywhere.
