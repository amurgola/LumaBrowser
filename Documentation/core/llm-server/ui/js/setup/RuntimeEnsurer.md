# RuntimeEnsurer

`core/llm-server/ui/js/setup/RuntimeEnsurer.js`

Makes sure the LLM inference runtime is installed.

## Methods

- `RuntimeEnsurer.ensure(api, runtimeId, hooks, isMlx)`: "Checking inference
  runtime…"; resolves `{ ok: true }` when `getRuntimesView()` lists it as
  installed. An MLX pick that is missing returns the pip guidance
  (`MLX_MISSING`) instead of an install that cannot work. Otherwise "Installing
  llama.cpp runtime…" with progress, resolving `{ ok: true }` or
  `{ ok: false, message: 'Runtime install failed: <error>' }`.

## Globals

None.
