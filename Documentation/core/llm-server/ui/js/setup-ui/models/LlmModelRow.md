# LlmModelRow

`core/llm-server/ui/js/setup-ui/models/LlmModelRow.js`

Builds the shared model-list row view (the mlRow contract) for one LLM scan model.

## Methods

- `new LlmModelRow({ recommender, ctxFit, fitBlock })`; `view(m)`; statics `weightsPath(m)`, `nameKey(m)`, `factsHtml(m)`, `sidecarTags(m)`. Every interpolated value is escaped (a stored display name with quotes cannot break out of `data-cur`, bug C1).

## Globals

None.
