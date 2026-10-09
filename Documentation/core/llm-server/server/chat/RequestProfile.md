# RequestProfile

`core/llm-server/server/chat/RequestProfile.js`

Per-runtime translation of the chat body the router builds (llama-server's
dialect) for servers that are stricter, plus rounding of the thinking dial onto
the levels a probed template really has.

## Methods

- `RequestProfile.apply(body, profile)` mutates and returns `body`. With no
  profile the body is untouched. A profile is a runtime entry's `request` block:
  - `chatTemplateKwargs: false` hoists the dial out of `chat_template_kwargs`:
    `enable_thinking: false` becomes `reasoning_effort: <effortOff>` (default
    `'none'`), a `reasoning_effort` is mapped onto `effortLevels` (omitted when
    it maps to nothing), and `chat_template_kwargs` is deleted.
  - otherwise, with `effortLevels` as an array, the kwarg level is reconciled in
    place; a level with no match is deleted, and an emptied kwargs object is
    removed.
  - `dropFields` names top-level fields to delete (llama.cpp-only samplers,
    `reasoning_budget`, slot ids).
- `RequestProfile.mapEffortLevel(level, levels)` is
  `ReasoningEffort.nearestEffort`: exact, else nearest rung up, else down;
  `null` means omit.
- `RequestProfile.fromThinking(thinking)` returns `{ effortLevels }` (a copy)
  for probe facts (`source: 'probe'`), else `null`.

## Why

NInfer rejects any unknown `chat_template_kwargs` key ("reasoning_effort is not
supported") and reads the dial top-level, with only the levels its template
exposes. A runtime declares that on its catalog entry, and the adapter applies
it here, so the router keeps building one dialect.

A llama.cpp load has no catalog profile but does have a probed thinking domain
([ThinkingProbe](../ThinkingProbe.md)). `fromThinking` turns it into a profile
that keeps the kwargs and only rounds the level, so "High" on a
low/medium/xhigh template sends xhigh, not a string the template ignores. An
empty domain means the template has no effort hint at all, so the kwarg is
dropped rather than sent to be ignored. Regex-era facts leave the body alone.
