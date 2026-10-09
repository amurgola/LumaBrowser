# TurnChecks

`core/llm-server/eval/TurnChecks.js`

Produces the weighted checks for one turn's `expect` block against one agent transcript.

## Methods

- `new TurnChecks(expect, transcript, addCheck)` where `addCheck(name, passed, weight, detail)`
  receives each check (weight `undefined` means 1).
- `collect()` emits, in order: completion, each expected tool call, ordering, forbidden tools,
  iteration ceiling, final answer, execution cases.
- `TurnChecks.DEFAULT_ITERATIONS_WEIGHT` is 0.5.

## Expect block

```
{ mustComplete?: boolean (default true),
  toolCalls?: [{ tool, params?, success?, required?, weight? }],
  ordered?: boolean,
  forbiddenTools?: string[],          // ["*"] = no tool call allowed at all
  maxIterations?: number, maxIterationsWeight?: number (default 0.5),
  finalAnswer?: { contains?, notContains?, regex?, flags?, weight? },
  execution?: { weight? } }
```

Param matchers are documented in [ExpectationMatcher](ExpectationMatcher.md).

- Optional tool calls (`required: false`) are recorded with weight 0 so they show in the
  breakdown without moving the score.
- `contains` and `notContains` are case-insensitive and accept a string or an array.
- The iteration count falls back to the number of tool calls when the transcript has none.
- `execution` grades `transcript.execution`, which the gambit runner fills by running the
  model's code (see [ExecutionCheck](../gambit/ExecutionCheck.md)). The scorer stays pure.

## Why `forbiddenTools: ["*"]`

Reaching for a tool when none was needed (a web search to write a limerick) is a real and
common failure that a list of tool names cannot express.
