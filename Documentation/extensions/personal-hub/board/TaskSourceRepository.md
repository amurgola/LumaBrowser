# TaskSourceRepository

`extensions/personal-hub/board/TaskSourceRepository.js`

Plain queries over `hub_task_sources`: the remote task trackers (ClickUp
workspaces) the board imports from. A
[SyncSourceRepository](../sync/SyncSourceRepository.md) with `TABLE =
'hub_task_sources'` and no colour column; see the base for `list`, `get`,
`due`, `insert`, `update`, `recordSync` and `delete`.
