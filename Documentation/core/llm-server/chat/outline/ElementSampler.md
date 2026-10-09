# ElementSampler

`core/llm-server/chat/outline/ElementSampler.js`

Chooses which array elements get profiled.

## Methods

- `ElementSampler.indices(length, limit)`: every index when `length <= limit`,
  otherwise `limit` indices spread evenly from the first to the last.

## Why

Paged API results often change shape towards the end (a trailing summary row,
fields added late). Spreading the sample across the whole array catches that
where a head-only sample would not, at the same cost.
