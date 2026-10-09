# HfModelInput

`core/llm-server/ipc/HfModelInput.js`

Reads the model download inputs the wizard accepts and names per-repo folders.

## Methods

- `HfModelInput.resolve(input)` returns `{ url, file }` (`https://huggingface.co/<path>?download=true`)
  for a full URL, a `huggingface.co` / `hf.co` blob or resolve page, or
  `owner/repo/<path>.gguf`. Throws `Paste a HuggingFace .gguf URL or owner/repo/file.gguf path.`,
  `Link a specific .gguf file (use its "download" / resolve URL).`,
  `Use a full .gguf URL, or owner/repo/file.gguf.` or `That doesn’t point at a .gguf file.`.
- `HfModelInput.repoDirName(repoId)` `owner/repo` -> `owner__repo`, other unsafe characters `_`.
- `HfModelInput.repoIdFromUrl(url)` the `owner/repo` of a Hub resolve URL, else null.
- `HfModelInput.fileFromUrl(url)` the decoded last path segment.

## Why

The scanner names an MLX snapshot after its folder, so the folder name must be
stable and filesystem-safe.
