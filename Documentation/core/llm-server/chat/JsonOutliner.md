# JsonOutliner

`core/llm-server/chat/JsonOutliner.js`

Outlines a tool result too big for the model's context. The full payload is
spilled to disk ([ToolResultSpill](ToolResultSpill.md)) and the model reads
this instead, one JSONPath per line:

```
(outline: one JSONPath per line; [*] = every element, ? = optional field)
$: object, 4 keys
  $.success = true
  $.rows: array, 300 items, 50 sampled, first = {"id":0,"title":"Row 0","status":"closed","note":"n0","score":0}
    $.rows[*]: object, 5 fields
      $.rows[*].id: integer 0..299, 50 distinct
      $.rows[*].title: string 5..7 chars, 50 distinct, e.g. "Row 0"
      $.rows[*].status: string, one of "closed", "open"
      $.rows[*].note?: string 2..4 chars, 7 distinct, in 7 of 50, e.g. "n0"
      $.rows[*].score: number 0..99.6667, 50 distinct
  $.html: string, 20006 chars, begins "<html>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"…
  $.meta = {"page":1,"total":300}
```

With a tighter budget, deeper lines and details drop first and a cut group
ends with `(+N more under <path>)`.

## Methods

- `JsonOutliner.outline(value, budgetTokens = 500)`: indented JSON when that
  fits the budget, compact JSON when only that fits, otherwise the outline. A
  non-positive or non-numeric budget uses the default.
- `JsonOutliner.DEFAULT_BUDGET_TOKENS` (500), `JsonOutliner.LEGEND`.

## Pipeline

1. [ProfileWalker](outline/ProfileWalker.md) profiles the value (bounded work).
2. [OutlineTreeBuilder](outline/OutlineTreeBuilder.md) turns profiles into lines.
3. [OutlineBudget](outline/OutlineBudget.md) picks lines breadth-first.
4. [OutlineRenderer](outline/OutlineRenderer.md) prints them in document order.

## Why

A sample of raw elements shows one or two rows; a schema shows every field,
which fields are optional, their kinds, ranges and categories, at the cost of
one line each. Paths are JSONPath so the model can name the exact slice it
wants from the spilled file (grep for a key, read a range) instead of guessing.

All token arithmetic uses the shared [TokenEstimator](../../shared/text/TokenEstimator.md)
ratio so the outline's budget agrees with every other context budget.
