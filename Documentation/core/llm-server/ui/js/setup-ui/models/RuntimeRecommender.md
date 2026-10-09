# RuntimeRecommender

`core/llm-server/ui/js/setup-ui/models/RuntimeRecommender.js`

Picks the runtime to recommend for a model on this host and renders its runtime tags.

## Methods

- `recommend(model)`: `{ id, explicit }` or null; `hostOrder()`: CUDA 13 build first on CUDA 13 drivers, CUDA 12, Vulkan on a GPU or without CUDA, CPU; `tagsHtml(model)`: required formats, the recommendation, then the other compatible runtimes.

## Globals

None.
