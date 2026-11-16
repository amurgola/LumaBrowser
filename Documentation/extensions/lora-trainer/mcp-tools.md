# mcp-tools

`extensions/lora-trainer/mcp-tools.js`

The module `manifest.mcpTools` points at: `{ tools, handler(toolName, args), bind(services) }`
over one [LoraTrainerTools](LoraTrainerTools.md) instance. `bind` is called by
[LoraTrainerExtension](LoraTrainerExtension.md) on activate and with null on deactivate.
The tools reach the chat agent as the lazy group `lora_training` (source `ext.lora-trainer`
in MergedSourceTable).
