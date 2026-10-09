# ThinkingVocabulary

`core/llm-server/server/ThinkingVocabulary.js`

Data only: the normalised reasoning-effort vocabulary and the template markers
the thinking probe reads its answers from.

## Members

- `PROBE_VERSION` (1), stamped on every facts object.
- `EFFORT_ORDER`: `none, minimal, low, medium, high, xhigh, max`, cheapest
  first. `none` is the disable path, not a level.
- `ENABLED_EFFORTS`: `EFFORT_ORDER` without `none`.
- `EFFORT_SPELLINGS`: native spellings a template may print per level
  (`xhigh` also matches `extra_high`, `very_high`, ...), used as name evidence.
- `PASSTHROUGH_DOMAIN`: `low, medium, high`. A pass-through template
  interpolates any string, so rendering cannot say which strings mean
  anything; the only such templates in the wild (harmony / gpt-oss) document
  this domain.
- `THINK_OPEN_MARKERS`: tokens a template emits to open a reasoning block
  (`<think>`, `<|channel|>analysis`, `[THINK]`, ...). Their presence at the end
  of the baseline prompt marks a fixed-thinking template.
- `SHAPES`: `user, system, history, tools`.
