# MlxModelBuilder

`core/llm-server/scanner/MlxModelBuilder.js`

Rolls MLX model directories (an unpacked HuggingFace repo: `config.json` plus
`.safetensors` shards) into `kind: 'mlx'` model entries.

## Methods

- `MlxModelBuilder.build(mlxDirs, rootDir)` one entry per directory that has both
  a config and at least one safetensors file. `weights[0].path` is the directory;
  the name is the directory name (the root's name when the root is the model);
  `weightsTotalBytes` sums the shards; `gguf: null`; `mlx: { quantization, architecture }`.
- `MlxModelBuilder.readConfigFacts(configPath)` returns
  `{ quantization: '<bits>-bit' | null, architecture: architectures[0] | null }`;
  an unreadable config gives nulls.

## Why

The unit `mlx_lm.server --model` loads is the directory, not a file.
