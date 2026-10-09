# ToolConcurrency

`core/llm-service/ToolConcurrency.js`

Decides which agent tool calls may overlap, and how big a parallel batch may be.

## Methods

- `ToolConcurrency.executionMode(toolName, params)` returns `'parallel'` or
  `'exclusive'`.
- `ToolConcurrency.resolveMaxParallel(requested, fallback = DEFAULT_MAX_PARALLEL_TOOL_CALLS)`
  returns an integer in `[1, 8]`; junk or values below 1 return `fallback`.
- Constants: `PARALLEL_SAFE_TOOLS`, `DEFAULT_MAX_PARALLEL_TOOL_CALLS` (1),
  `NATIVE_MAX_PARALLEL_TOOL_CALLS` (1), `MAX_PARALLEL_TOOL_CALLS_CEILING` (8),
  `PARALLEL`, `EXCLUSIVE`.

## Why

Parallel-safe is an allow-list with an exclusive default. A safe tool must be
read-only, order-independent and free of shared mutable state (ledger
accounting, the working tab, file or artifact writes). Getting this wrong in
the permissive direction is not a slow run, it is two `click` calls racing on
one page or two `edit_file` calls interleaving, so unknown tools (extension,
MCP) are exclusive.

`web_search` depends on its arguments: with a `url` it is a page fetch (a
read, already exempt from the ledger's cap); a real query counts against the
per-tool cap, which is only accounted correctly one call at a time.

Both defaults are 1 (batching off) on measured evidence. Re-graded 2026-08-21
on the fixed harness (39-task gambit, Qwen3.8-27B at 32k), pool 4 lost on every
axis batching was meant to buy: wall time +14%, iterations +20, score 100% to
98.4%, and an artifact task overflowed its context because a batch packs
several tool results into one prompt. The native-tools knob is separate
because the transports fail differently; it was graded separately and showed
the same signature. Retune per model family and re-grade
(scripts/run-gambit.js) before raising either. 1 is the kill switch: it
reproduces the one-call-per-iteration loop exactly.
