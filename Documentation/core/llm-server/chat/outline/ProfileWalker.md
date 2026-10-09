# ProfileWalker

`core/llm-server/chat/outline/ProfileWalker.js`

Walks a value into a [ValueProfile](ValueProfile.md) tree.

## Methods

- `ProfileWalker.profile(value)`: the root profile (path `$`).

## Limits

- `ELEMENT_SAMPLE` (50): elements profiled per array, chosen by
  [ElementSampler](ElementSampler.md). Enough for stable presence and kind
  counts and to see a handful of categories repeat.
- `MAX_DEPTH` (12): deeper than any line the budget would admit.
- `VISIT_BUDGET` (5000): values profiled per result in total, so nested arrays
  cannot multiply the work; a few milliseconds whatever the input size.

## Why

The outline is built for results too big to show, so its own cost must not
grow with the result.
