# LlmModelDisplayNames

`core/llm-server/service/LlmModelDisplayNames.js`

The user's display-name overrides for local chat models, keyed by model file
stem. Extends [ModelTextOverrides](ModelTextOverrides.md).

## Methods

- `new LlmModelDisplayNames(settingsDb)`.
- `all()`, `get(key)`, `set(key, name)` inherited (blank name reverts to the default).
- `resolve(stem)` `ModelName.resolveDisplayName({ stem, overrides })`: the
  override, else the curated catalog label, else the prettified stem.
- `STORAGE_KEY` `core.llmServer.modelDisplayNames`.

## Why

The file stem stays the stable identifier everywhere (model id, queue key,
`local::` ref); this is only the label every surface shows.
