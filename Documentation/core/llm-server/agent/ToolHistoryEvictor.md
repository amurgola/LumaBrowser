# ToolHistoryEvictor

`core/llm-server/agent/ToolHistoryEvictor.js`

Holds a run's tool results under a budget by replacing evicted ones with a stub.

## Methods

- `ToolHistoryEvictor.evict(messages, ledger, budget, onEvicted = null,
  hardBudget = Infinity)`: `ledger` is `[{ index, tool, params, chars }]`,
  newest last; both arrays are mutated in place and the call is idempotent.
  1. Soft pass while over `budget` and more than `KEEP_RECENT` (4) entries:
     evict the largest `chars x age` outside the recent four. A result over
     half the budget loses its recency shield once anything newer exists.
  2. Hard pass while over `hardBudget`: the floor yields down to the newest
     result, which is never dropped.
  The evicted message becomes `[Tool Result for X]: (N chars dropped to fit the
  context window. If you still need this, run it again; do not assume you
  remember it.)`, the entry leaves the ledger, and `onEvicted({ tool, params })`
  is told (a throwing hook is ignored).
- Forensics: with `LUMA_EVICT_LOG=<path>` set, each eviction appends one JSON line.

## Why size-weighted

Probed live: one 7.8k-token page dump was 87% of the budget, and oldest-first
eviction kept it while churning the small results the model was acting on.
