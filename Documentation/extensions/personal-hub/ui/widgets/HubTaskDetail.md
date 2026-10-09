# HubTaskDetail

`extensions/personal-hub/ui/widgets/HubTaskDetail.js`

The board widget's task detail: an overlay inside the widget with the task's
tracker status, where it lives, its people, dates and tags, the description,
its message thread (remote comments and local messages, unsynced ones marked)
and a composer that sends a message to the task. The task can be hidden from
the board from here.

## Methods

- `new HubTaskDetail(root, host, { onChange, onHide? })`: `onHide(taskId,
  hidden)` hides or shows the task; without it there is no Hide button.
- `open(taskId)`: shows `Loading`, calls `getTask(taskId)` ->
  `{ task, messages, source }`, renders the head, the body and the composer.
- `close()`, `isOpen()`.

## Layout

- Head: a source eyebrow (the source label, else `Local task`), the title,
  `Open in ClickUp` (`Open` for other kinds) when the task has a url,
  `Hide` / `Unhide` through `onHide` (hiding closes the detail, unhiding
  reopens it) and a close icon.
- Meta: a label/value list leaving out empty fields: Status (the
  [TaskChrome](TaskChrome.md) status pill, a `Moving to "<status>" (not synced
  yet)` note, a `Hidden` badge), Sync (the task's last push error in
  `.hub-sync-error`, only while `syncError` is set), List (`Source / Space / List`), Assignees
  (initials plus name, read through `TaskChrome.names` so `{ id, name }`
  objects no longer render as `[object Object]`), Due, Priority, Tags.
- Description and Messages (`Messages (N)`, or `No messages yet.`) sections.

Messages: `.hub-msg` (`is-local` for messages written here); a local message
that is not `synced` shows `Sending` or `Not sent: <syncError>`. Send (or
Ctrl/Cmd+Enter) calls `addTaskMessage(taskId, body, {})`, reopens the detail
and calls `onChange`; a failure shows an error line above the composer.
