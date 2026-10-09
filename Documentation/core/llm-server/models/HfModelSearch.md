# HfModelSearch

`core/llm-server/models/HfModelSearch.js`

Searches the HuggingFace Hub for GGUF repos, or MLX repos in MLX mode.

## Methods

- `HfModelSearch.search({ query = '', sort = 'downloads', limit = 20, signal, mlx = false })`
  returns `[{ repoId, author, name, downloads, likes, updatedAt, gated }]`,
  dropping rows with no id. `sort` is one of `downloads|likes|lastModified`
  (anything else falls back to `downloads`); `limit` is clamped to 1..100;
  results are descending.

## Why

`filter=gguf` is the model-card tag and reliably returns GGUF-only repos.
`library=gguf` does not constrain results when combined with `search`; it
leaks base safetensors repos that then expand to "no quants found".
`filter=mlx` is the MLX equivalent. The formats are mutually exclusive, so
`mlx` is a mode switch.

For GGUF the query gets " gguf" appended (unless already present) to bias
ranking toward quant repos, which name themselves `...-GGUF`. MLX repos carry
no format token in the name, so the MLX query stays verbatim.
