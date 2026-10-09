# ThinkingOffParams

`core/llm-service/ThinkingOffParams.js`

Provider request-body fields that turn hidden reasoning off, guessed from the
model id.

## Methods

- `ThinkingOffParams.forModel(modelId)` returns a fresh params object (`{}`
  for unknown families and Claude). First matching family wins:

  | Family | Fields |
  | --- | --- |
  | Qwen / QwQ | `chat_template_kwargs: { enable_thinking: false }`, `reasoning_effort: 'minimal'` |
  | GLM / ChatGLM / Z.AI | `enable_thinking: false` |
  | DeepSeek R1 / Reasoner / v3.1-thinking | `thinking: { type: 'disabled' }` |
  | GPT-5, o1, o3, o4 | `reasoning_effort: 'minimal'` |
  | gpt-oss | `reasoning_effort: 'low'` |
  | Grok 3-mini / 4 | `reasoning_effort: 'low'` |
  | Gemini 2.5 | `thinkingConfig: { thinkingBudget: 0 }` |
  | any `provider/model` id (OpenRouter style) | `reasoning: { effort: 'none' }` |

- `ThinkingOffParams.isQwenFamily(modelId)`.

## Why

Hidden reasoning is rarely wanted here: template generation validates every
candidate against the live DOM and the agent loop externalises its reasoning
through tool calls, so hidden reasoning tokens are pure latency. Servers
silently ignore fields they do not implement, so a slightly wrong guess is
harmless.

Qwen stacks two body signals: `chat_template_kwargs` is the official path but
LM Studio strips unknown kwargs, while `reasoning_effort` goes through a
generic reasoning middleware on some LM Studio builds. `preserve_thinking` is
deliberately not sent; stricter parsers rejected the whole kwargs dict over
it. The third Qwen lever is the in-message [NoThinkDirective](NoThinkDirective.md).
