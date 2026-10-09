# TimedTasksRenderer

`extensions/timed-tasks/ui/TimedTasksRenderer.js`

The Timed Tasks renderer in the main window. It drives the right-dock panel
(`panel.html`) and the settings page (`settings.html`), both mounted by the
shell from the manifest before `activate()`, and keeps them current from the
main process `changed` event.

## Methods

- `activate(context)`: `context` is the shell's extension context
  (`ipcBridge`, `slotManager`, `containers.panelContainer`,
  `containers.settingsContainer`). A second call deactivates first so timers
  and listeners never double up. Builds [TaskForm](TaskForm.md),
  [TaskList](TaskList.md) (with a [TaskRunList](TaskRunList.md)) and
  [TimedTasksSettingsPage](TimedTasksSettingsPage.md); sets the settings tab's
  `onActivate` callback (reload tasks and the model label); loads the model
  label and the tasks; subscribes to `ext.timed-tasks.changed`; starts a 30 s
  text-only tick (header and row meta lines, never rebuilding rows).
- `deactivate()`: stops the tick and pending reload, unsubscribes, closes any
  open overflow menu and forgets all state.

A `changed` burst is coalesced into one reload after 150 ms; when the payload
is `run-finished` for the expanded task, its run history reopens at the newest
page. The panel header shows [TaskRowText](TaskRowText.md) `count` and `next`.

## IPC

Invokes `ext.timed-tasks.getAllTasks`, `createTask`, `updateTask`,
`deleteTask`, `triggerNow`, `getTaskRuns(id, limit, offset)`, `getRunLog(runId)`;
listens on `ext.timed-tasks.changed` (see
[TimedTasksExtension](../TimedTasksExtension.md) and
[TaskBroadcast](../TaskBroadcast.md)).

## Globals

None directly. The entry `renderer.js` writes `window.__ext_timed_tasks`
(`{ activate, deactivate }`), the shell's extension renderer contract. The
classes it builds read `window.llmSlotAPI`, `window.electronAPI` and
`window.LumaModal` (through Dialogs).
