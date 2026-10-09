# CallRecord

`core/llm-server/chat/tool-loop/CallRecord.js`

One tool call as the loop monitor remembers it.

## Methods

- `new CallRecord(step, name, params)`: `step`, `name`, `params`,
  `signature` ([CallSignature](CallSignature.md)), `query`
  ([LookupTools](LookupTools.md)`.queryOf`); `ran`, `succeeded` false;
  `novelty`, `inertKey` null; `changedPage` false.
- `isSearch`: has a query.
- `settle(result, novelty)`: marks it ran, records success (`success !== false`),
  keeps `novelty` only on success, and reads the browser evidence
  (`result.data.evidence` or `result.evidence`). `outcome: 'changed'` sets
  `changedPage`. `no_change` with a `stateKey` sets
  `inertKey = tool|target|stateKey` ([ActionTarget](ActionTarget.md)).
- `madeProgress(bar)`: a changed page, or a lookup whose novelty is at least `bar`.

## Why

Holds everything the checks need about one call in one place. Only lookups'
novelty counts as progress, because a click's status line is "new" every time
and proves nothing.
