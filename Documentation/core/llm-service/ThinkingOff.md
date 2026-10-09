# ThinkingOff

`core/llm-service/ThinkingOff.js`

Resolves both reasoning-off levers for one call: the llama-server knobs and
the in-message `/no_think` directive.

## Methods

- `ThinkingOff.resolve(modelRef, messages, thinking = null)` returns
  `{ extra, messages, fixed }`. `extra` is the probe's disable knobs, else the
  model-id guess, else the generic `{ chatTemplateKwargs: { enable_thinking:
  false }, reasoningBudget: 0 }`. `messages` has the
  [NoThinkDirective](NoThinkDirective.md) applied. When probe facts say the
  template cannot turn thinking off, returns `{ extra: null, messages, fixed: true }`.
- `ThinkingOff.extraFor(modelRef)` returns `{ chatTemplateKwargs?,
  reasoningBudget? }` derived from [ThinkingOffParams](ThinkingOffParams.md), or
  null for a model with no reasoning to disable.
- `ThinkingOff.extraFromProbe(thinking)` returns `{ extra, fixed }` from probe
  facts (`source: 'probe'`, `thinkingFixed`, `disableKwarg`), or null without
  usable facts.

## Why

The body knobs alone are not enough: some Qwen chat templates silently ignore
`enable_thinking:false`, which is why the in-message directive is a separate
lever. Every caller that wants no thinking wants both, and the halves take
different inputs (a provider-prefixed ref here, a bare id for the directive,
whose regex the `::` would defeat). Resolving them together fixed bug M14,
where complete()/completeStream() applied neither and voice turns applied the
directive to a ref that could never match.

Probe facts (from the llm-server thinking probe) win over the regex because
the probe saw what this template actually does. Any disabling signal also
sets `reasoningBudget: 0`, because some llama.cpp builds read only that knob.
