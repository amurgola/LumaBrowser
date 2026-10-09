# BoardColumnRepository

`extensions/personal-hub/board/BoardColumnRepository.js`

Plain queries over `hub_board_columns`: the board's columns ("tabs") in display
order, each a status a task can be in. `HubSchema` seeds backlog, todo, doing,
review and done on an empty table.

## Methods

- `new BoardColumnRepository(db)` over the extension's DatabaseService.
- `list()`: by `sort_order` then title.
- `byKey(key)`, `doneColumn()` (the first `is_done` column, or `null`).
- `upsert({ id, key, title, sortOrder, isDone })`: an UPDATE when the key
  exists, else an INSERT. Two statements rather than `ON CONFLICT ... DO
  UPDATE SET`, because the extension database's table scan reads "update set"
  as a table named `set`.
- `delete(key)`.

Rows hydrate to `{ id, key, title, sortOrder, isDone }`.
