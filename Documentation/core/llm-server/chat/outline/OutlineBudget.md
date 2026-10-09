# OutlineBudget

`core/llm-server/chat/outline/OutlineBudget.js`

Chooses which outline lines fit a token budget.

## Methods

- `new OutlineBudget(budgetTokens).select(root)` returns
  `{ admitted, detailed, hidden }`.
- `OutlineBudget.cost(line)`: tokens for a printed line plus its newline, at the
  shared [TokenEstimator](../../../shared/text/TokenEstimator.md) ratio.

## Rules

1. The root line is always admitted.
2. Breadth-first: a node's children are admitted in order until one does not
   fit, so every top-level key is listed before anything nested.
3. While more children could follow, an admission must leave room for the
   `(+N more under path)` line, which is charged when the group is cut. A
   group cut before its first child gets no such line: the parent already
   says how many keys or items it has.
4. Leftover tokens upgrade admitted lines with their detail, shallowest first.

## Why

Breadth-first is the simplest rule that guarantees the overview (what is
there) before depth (what is inside), and it needs no per-subtree size
measurement: each line's cost is known exactly once it is written.
