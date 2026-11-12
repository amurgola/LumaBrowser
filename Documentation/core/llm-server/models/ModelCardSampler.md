# ModelCardSampler

`core/llm-server/models/ModelCardSampler.js`

Reads the sampler settings a model's author recommends out of what a Hugging
Face repo publishes. Pure.

- `fromCard(card)`: from the model card, whether prose, a markdown table or
  styled HTML (`<span>temp</span><span>0.9</span>`). Returns override fields:
  `temperature`, `topP`, `topK`, `minP`, `repeatPenalty`, `presencePenalty`.
  A field is kept only when every mention of it in the card gives the same
  value (a card with one temperature for thinking mode and another without
  says nothing usable), and only inside its sane range (a temperature of zero
  is an evaluation setting; `top_p 95` and `min_p 2%` are not values).
- `fromGenerationConfig(config)`: the same from `generation_config.json`
  (`temperature`, `top_p`, `top_k`, `min_p`, `repetition_penalty`,
  `presence_penalty`), unless `do_sample` is false.
- `baseModels(card)`: the repos named in the frontmatter's `base_model`.
- `isRepackaging(card, repoId)`: true when the repo is a quantisation of its
  base (`base_model_relation: quantized`, or no relation and a repo name such
  as `-GGUF`). A fine-tune, merge or adapter is a different model.
- `plain(card)`: the card as plain text.
