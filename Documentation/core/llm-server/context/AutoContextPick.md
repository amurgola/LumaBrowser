# AutoContextPick

`core/llm-server/context/AutoContextPick.js`

The chat picker's auto-picked context ladder and its default rung.

## Methods

- `AutoContextPick.ladder(kvOptions, modes, rungCount)` per rung index, across
  `modes` in order (best quality first): a measured ok, else any measured row,
  else the first mode's rung.
- `AutoContextPick.recommendedTokens(contextOptions)` the largest measured-ok
  rung, else the largest estimated ok, else the largest partial, else the
  smallest rung, else null.

## Why

It is derived from the strict per-mode ladders so the planner is not asked the
same question twice, and a new KV mode joins the fallback chain just by being
added to the mode table.
