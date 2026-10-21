# ReaderScripts

`extensions/site-apis/runtime/ReaderScripts.js`

The in-page probe behind reader recovery: finds the element a `read`, `extract` or `table` step describes
without a model, and lists every element it considered as a candidate for the LLM pass.

## Methods

- `ReaderScripts.probe(kind, description, childSelectors?)` -> the expression to send through `executeJs`. The
  page answers `{ success, kind, match: { selector, text, strategy } | null, candidates: [{ selector, tag, id,
  classes, text (60 chars), ... }] }` (candidates in the `SelectorPrompt` snapshot shape).
- `ReaderScripts.MARKER`: the comment the expression starts with (test seams detect it).

## How it picks

- `read`: every element's text (innerText, whitespace collapsed, case-insensitive) is compared with the
  description. Exact matches win; among them the deepest (no matching descendant) and then the smallest
  element. Without an exact match, a starts-with match counts when exactly one element (deepest first) starts
  with the description, then a contains match under the same rule. Candidates: the exact, starts-with and
  contains elements (`match` and `rank` fields), up to 40.
- `extract`: siblings sharing a parent, tag and class set form a group (2+ members). Each group is scored by
  how many members satisfy every child selector (x10), whether a member's text holds the description (+5) and
  whether every member matches (+1); the best group wins when at least one member matches the child selectors.
  The answer is `<parent selector> > tag.classes`, verified to match exactly the group's members.
- `table`: the `<table>` whose text holds the description, else the only table; without any table, the sibling
  groups whose text holds the description.
- Selectors: `#id` when unique, else `[data-testid="..."]` when unique, else a `>` path of `tag:nth-of-type(n)`
  parts from the nearest ancestor with a unique id (or `body`), verified to match exactly that element.

## Decisions

A plain function serialized with `toString()` (like core's `InterstitialWait`), ES5 inside so it runs in any page.
It stops at 6000 elements and 40 candidates.
