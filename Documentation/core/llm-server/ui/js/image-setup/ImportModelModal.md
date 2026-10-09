# ImportModelModal

`core/llm-server/ui/js/image-setup/ImportModelModal.js`

"Import custom image model": from a Hugging Face model page (recipe resolver, no name needed), a direct file URL or a local file, with the base architecture, a prompt style for bases that have profiles, and the Qwen and Anima notes. Closes on kickoff; progress shows in the Models card.

## Methods

- `open()` (ignored while open). IPCs: `getPromptProfiles`, `pickImportFile`, `importModelFromRepo`, `importModelFromUrl`, `importModelFromFile`.

## Globals

None beyond ImageModal.
