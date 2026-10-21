# HfMlxRepo

`core/llm-server/models/HfMlxRepo.js`

Describes one MLX (Apple Silicon) repo on the HuggingFace Hub for the MLX
downloader and the music server.

## Methods

- `HfMlxRepo.fetchInfo(repoId, { signal, revision })` returns `{ repoId, author,
  name, gated, paramsB, maxContext, architecture, quantization, totalBytes,
  weightsBytes, revision, files }` with `files` as `[{ path, size, sha256 }]`
  (directories and unsafe paths excluded; `sha256` from the LFS pointer, null
  for plain blobs) read at the commit [HfPinnedRepo](HfPinnedRepo.md) pinned
  (`revision` is its `{ requested, sha, pinned, fallbackReason }`). Throws
  `HF_BAD_ID` for a malformed id, `HF_NOT_FOUND` ("No such model: <id>") when
  the model page is missing, and the `HF_ACCESS_DENIED` access error for a
  gated or private repo. A missing `config.json` is not an error.
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
