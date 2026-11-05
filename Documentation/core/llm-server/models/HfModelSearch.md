# HfModelSearch

`core/llm-server/models/HfModelSearch.js`

Searches the HuggingFace Hub for GGUF repos, or MLX repos in MLX mode, and brings back the Hub's GGUF summary with each row.

## Methods

- `HfModelSearch.search({ query = '', sort = 'trending', limit = 20, signal, mlx = false })`
  returns `[{ repoId, author, name, downloads, likes, trendingScore, updatedAt, gated, pipelineTag, architecture, paramsB, maxContext }]`,
  dropping rows with no id. `sort` is one of `trending|downloads|likes|lastModified` (`SORTS` maps them
  to the Hub's `trendingScore`, `downloads`, `likes`, `lastModified`; anything else falls back to trending);
  `limit` is clamped to 1..100; results are descending. `sortField(sort)` is that mapping.
- In GGUF mode the request carries `expand[]` for `GGUF_FIELDS` (downloads, likes, lastModified, gated, gguf,
  pipeline_tag, trendingScore); the `gguf` summary gives `architecture`, `paramsB` (`total / 1e9`) and
  `maxContext`. MLX rows have no summary, so those fields are null.

## Why

`filter=gguf` is the model-card tag and reliably returns GGUF-only repos.
`library=gguf` does not constrain results when combined with `search`; it
leaks base safetensors repos that then expand to "no quants found".
`filter=mlx` is the MLX equivalent. The formats are mutually exclusive, so
`mlx` is a mode switch.

For GGUF the query gets " gguf" appended (unless already present) to bias
ranking toward quant repos, which name themselves `...-GGUF`. MLX repos carry
no format token in the name, so the MLX query stays verbatim.

Trending is the default because the all-time download order is dominated by
old quants and non-chat GGUFs (speech, embedding, diffusion); the summary
fields let [HfModelFilter](HfModelFilter.md) hide those and badge the rest
without opening each repo. With `expand[]` the Hub answers only the fields
asked for, which is why every needed field is listed.
