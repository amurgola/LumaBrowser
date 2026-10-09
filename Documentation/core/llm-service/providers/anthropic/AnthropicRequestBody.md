# AnthropicRequestBody

`core/llm-service/providers/anthropic/AnthropicRequestBody.js`

Builds the Messages API request body.

## Methods

- `build(messages, options, model, stream)` returns `{ model, messages,
  max_tokens, stream?, system?, thinking?, output_config? }`. Messages go
  through [AnthropicMessageConverter](AnthropicMessageConverter.md);
  `max_tokens` through `AnthropicModelLimits.resolveMaxTokens`. On adaptive
  models: `thinking: { type: 'adaptive', display: 'summarized' }` plus
  `output_config.effort` when one applies (`xhigh` becomes `high` on 4.6).
- `effortFromOptions(options)`: `options.reasoningEffort`, else
  `chatTemplateKwargs.reasoning_effort` (one of low, medium, high, xhigh,
  max), else `'low'` for `enable_thinking: false` or `reasoningBudget: 0`,
  else null (model default).

## Why

`temperature` is never sent: deprecated on Claude 4.x, rejected on the 5 family.
The summarized display is requested because the default streams empty
thinking text, which the user sees as a dead bubble. A "no think" request maps
to the lowest effort rather than disabling thinking: on claude-opus-5 disabled
thinking sometimes writes tool calls as visible text.
