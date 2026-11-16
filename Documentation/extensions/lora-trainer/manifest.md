# manifest

`extensions/lora-trainer/manifest.js`

Manifest of the bundled LoRA Trainer add-on: id `lora-trainer`, no declared
dependencies (it uses the always-provided `imageTraining` and `chat` surfaces and reaches
the image services lazily), `main: ./main.js`, `mcpTools: ./mcp-tools.js`.

It is not `distributable`: it requires core modules directly.
