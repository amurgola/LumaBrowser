# ThinkingKnobs

`core/llm-server/server/ThinkingKnobs.js`

Reads a client's thinking preference from a chat-completions body, in any of
its spellings, and translates it to the knobs llama-server honours. Shared by
the localhost API ([OpenAiLocalRouter](OpenAiLocalRouter.md)), the Anthropic
Messages route and the Network Sharing router.

## Methods

- `ThinkingKnobs.extra(body, hostFallback = null)` returns
  `{ chatTemplateKwargs?, reasoningBudget? }` or `null` when nothing applies.
  Spellings, weakest first:
  - `hostFallback`, a dial id, used only when the client said nothing at all;
  - top-level `reasoning_effort` as a dial position: `'off'` means disable,
    `'default'` sends nothing, a level becomes `{ reasoning_effort }`;
  - native `chat_template_kwargs` and `reasoning_budget`, which win over the dial;
  - `enable_thinking` (boolean or `'true'`/`'false'`). Disabling always sends
    both `enable_thinking: false` and `reasoning_budget: 0` unless a budget was given.
- `ThinkingKnobs.apply(body, hostFallback)` writes the result into `body`
  (`chat_template_kwargs`, `reasoning_budget`), deletes `enable_thinking`, and
  returns the same object.
- `ThinkingKnobs.refusal(body, thinking)` returns
  `{ code: 'thinking_cannot_be_disabled', message }` when probe facts say the
  template has `thinkingFixed` and the (already applied) body asks for Off
  (`enable_thinking: false`, `reasoning_budget: 0` or `reasoning_effort: 'none'`);
  otherwise `null`. The message lists the supported levels, or `default`.

## Why

llama-server does not read a top-level `enable_thinking`, so OpenAI and
vLLM-style clients that send it were silently ignored and Qwen3 kept producing
long hidden reasoning. Some builds only honour `reasoning_budget: 0`, hence both
knobs on disable.

A paired client is a user, not a subordinate: whatever it asks for is what it
gets, and the host's dial only fills silence, in either direction.

When the probe proved a template cannot turn thinking off, forwarding the knobs
would run the model with reasoning on while the client believes it asked for
none, so the route refuses instead.
