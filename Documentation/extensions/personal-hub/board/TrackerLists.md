# TrackerLists

`extensions/personal-hub/board/TrackerLists.js`

The lists a task source imports, with the statuses each one offers, asked of
the tracker (the provider's `describeLists`) at most once per `CACHE_MS`
(10 min). The board needs them to name lists in the quick-add and to know which
statuses a move may push.

## Construction

```js
new TrackerLists({ fetchImpl: null, now: () => new Date() })
```

`fetchImpl` is passed through to the provider; `now` is a test seam. The cache
is keyed by source id plus its `config.listIds`, so changing the imported lists
asks again.

## Methods

`ctx` is `{ provider, token, source }`, as BoardService builds it.

- `async lists(ctx)` -> `[{ id, name, statuses: [{ status, type, color }] }]`;
  throws when the tracker fails (nothing is cached then).
- `async statuses(ctx, listId = '')` -> the statuses of one list, of every
  imported list when `listId` is empty or not among them, deduplicated by name
  ignoring case; `null` when the tracker cannot say.
- `async listName(ctx, listId)` -> the list's name, `''` when unknown or the
  tracker fails.
