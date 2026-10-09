# ProfileSummary

`core/llm-server/chat/outline/ProfileSummary.js`

The words for one profiled path.

## Methods

- `ProfileSummary.describe(profile)` returns `{ text, detail, expands }`:
  - seen once and at most `INLINE_CHARS` (120) as JSON: ` = <json>` (never for
    the root, which only reaches the outline because it did not fit);
  - a long string: `: string, N chars`, detail `, begins "..."…`;
  - an array: `: array, N items[, M sampled]`, detail `, first = <json>` when the
    first element is at most `EXAMPLE_CHARS` (160);
  - an object: `: object, N keys`;
  - seen many times: each kind present, joined with ` | `, phrased by its stats;
    detail is a string example when free-form strings were seen;
  - `expands` asks for child lines (fields, elements).

## Why

Short values are cheaper to show than to describe; long ones are described by
measurable facts. Details are kept separate so the budget can add them only
when every path already has its line.
