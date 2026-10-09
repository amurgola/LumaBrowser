# HfMlxRepo

`core/llm-server/models/HfMlxRepo.js`

Describes one MLX (Apple Silicon) repo on the HuggingFace Hub for the MLX
downloader and the music server.

## Methods

- `HfMlxRepo.fetchInfo(repoId, { signal })` returns `{ repoId, author, name,
  gated, paramsB, maxContext, architecture, quantization, totalBytes,
  weightsBytes, files }` with `files` as `[{ path, size }]` (directories
  excluded). Throws `HF_BAD_ID` for a malformed id and `HF_NOT_FOUND` ("No such
  model: <id>") when the model page is unreadable. A missing `config.json` is
  not an error.
- `HfMlxRepo.quantFromName(repoId)` reads `4bit` -> `4-bit`, `bf16` -> `BF16`
  style tokens from a repo id, else `null`.

## Where each fact comes from

- `paramsB`: the model page's `safetensors.total` / 1e9.
- `maxContext`: `config.max_position_embeddings`.
- `architecture`: `config.architectures[0]`, else `config.model_type`.
- `quantization`: `config.quantization.bits` or
  `config.quantization_config.bits` as `N-bit`, else the repo name
  (mlx-community names repos `...-4bit` / `...-8bit` / `...-bf16`).
- `weightsBytes`: total of `.safetensors` files, or the whole repo when there
  are none.

An MLX repo is one logical model (a safetensors directory), so unlike GGUF it
has no per-quant variants; the downloader snapshots every file.
