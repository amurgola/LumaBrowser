# StatusMapping

`extensions/personal-hub/board/StatusMapping.js`

Maps a remote tracker's task status onto a board column and back. Static.

A source's `config` carries the maps it reads:

- `statusColumns`: normalized status -> column key, the links made by merging a
  pseudo column or picking a status on a move.
- `statusLabels`: normalized status -> the status as the tracker spells it (for
  display).
- `statusMap`: column key -> the status pushed when a task is moved there.

A status with no link, no `statusMap` entry and no column of the same name has
no column: its tasks sit in a pseudo column keyed by the status until the user
links it. There is no fallback on the status type any more.

## Methods

- `columnForStatus(columns, source, remoteStatus)`: the column a remote task
  lands in, tried in order:
  1. a link in `config.statusColumns`,
  2. `config.statusMap` reversed (a column key whose mapped status equals the
     remote status),
  3. a column whose `key` or `title` equals the status.
  `null` when none matches, the status is blank or the board has no columns.
- `columnKeyForStatus(columns, source, remoteStatus)`: the matched column's key,
  else the status's pseudo key.
- `pseudoKey(status)`: `~` (`PSEUDO_PREFIX`) plus the normalized status.
- `isPseudo(columnKey)`: true for a key starting with `~`.
- `statusForColumn(columns, source, columnKey, listStatuses)`: the remote status
  to push when a task moves into a column.
  - With `listStatuses` (the `[{ status }]` of the task's list): the
    `statusMap` entry if the list has it (returned in the list's spelling),
    else the single list status linked or named for the column, else `null`
    (the user has to pick).
  - Without (the tracker could not be asked): `statusMap[columnKey]` when set,
    else the column's title.
- `link(config, status, columnKey)`: a new config with the status linked to the
  column (`statusColumns` and `statusLabels`); the status leaves any other
  column's `statusMap` entry and becomes this column's pushed status only when
  it has none yet.
- `prune(config, columnKeys)`: a new config without links or `statusMap`
  entries pointing at columns not in `columnKeys`; `null` when nothing changed.
- `matches(a, b)`: true when two status names differ only by case, spaces,
  underscores or hyphens (false for a blank `a`).

## Why

ClickUp statuses are per list and named by the user, so there is no fixed
table. Guessing by status type put tasks in the wrong lane; an unknown status
now shows as its own lane and the user decides once where it belongs.
