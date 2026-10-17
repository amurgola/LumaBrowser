# HubInboxWidget

`extensions/personal-hub/ui/widgets/HubInboxWidget.js`

The Hub's conversation queue widget (`manifest.dashboard.widgets` id
`inbox`): open threads from every chat and mail app (rolled up from
intercepted notifications and enriched by an automation), newest first, with
review, snooze, done, open and to-task actions. Extends
[HubWidgetBase](HubWidgetBase.md); reloads on `thread.changed`.

## Behaviour

- Loads `listThreads({ state: 'open' })` and sorts by `lastAt` descending.
  The head shows the open count and, with more than one app present, filter
  chips (`All`, then each app's short name).
- Rows: an app tag (`APPS`: slack, teams, gmail, outlook, messages,
  clickup, proton, discord; the tag is neutral and the app's colour, passed
  as the `--hub-app` custom property, shows as a small dot; unknown apps get
  a grey dot), the title (participants, then `(untitled)` as fallbacks), a
  priority chip when not `normal`, a plain count when more than one
  notification, the relative time, the participants line, and the summary
  or the last notification's body (two-line clamp).
- Actions: `Reviewed` -> `setThreadState(id, 'reviewed', {})`;
  `Snooze 4h` -> `'snoozed'` with `{ snoozeUntil }` four hours out; `Done`;
  `Open` (when the thread has a url, through `host.openTab`); `To task` ->
  `createTask({ title, description })` from the thread's title and summary or
  last body, then `linkThreadToTask(threadId, task.id)`. A thread already
  linked shows `On the board` instead.
- Empty state: `Queue clear. New chat and mail notifications land here.`.
