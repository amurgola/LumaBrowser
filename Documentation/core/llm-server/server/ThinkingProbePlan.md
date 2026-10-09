# ThinkingProbePlan

`core/llm-server/server/ThinkingProbePlan.js`

Builds the bounded set of /apply-template renders the thinking probe sends.

## Methods

- `ThinkingProbePlan.buildShapes(nonce)` returns the four conversation shapes
  (`user`, `system`, `history` with an earlier assistant turn carrying
  `reasoning_content`, `tools` with one probe tool). Each carries the nonce so
  a render that dropped it is recognisable as broken.
- `ThinkingProbePlan.buildPlan(invalid)` returns `[{ key, shape, kwargs }]`:
  four baselines, four `enable_thinking:false`, two `enable_thinking:true`,
  seven effort levels and one render per invalid value (19 with two invalid
  values). The first entry is always `base:user`, which doubles as the
  "does /apply-template exist" check.
- `ThinkingProbePlan.historyEffortEntries()` returns the two conditional
  history-shape effort renders (low, high).
- `ThinkingProbePlan.requestBody(shapes, entry)` builds the POST body,
  omitting `tools` and `chat_template_kwargs` when empty.
