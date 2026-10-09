# TaskForm

`extensions/timed-tasks/ui/TaskForm.js`

The Timed Tasks panel's create/edit form.

## Methods

- `new TaskForm(root, invoke, onSaved)`: `root` is the panel container,
  `invoke(channel, ...args)` calls `ext.timed-tasks.<channel>`, `onSaved()`
  runs after a successful create or update. Mounts an
  [IntervalPicker](../../ui-kit/ui/IntervalPicker.md) (`tt-bar-interval`,
  every hour) and wires `+ New task` (toggles the form), Cancel and
  Create/Save.
- `open(task)`: shows the form, empty for `null` ("New task", Create) or filled
  from a task ("Edit task", Save), and focuses the name.
- `close()`: hides it and restores the `+ New task` button.
- `submit()`: requires a name (`Give the task a name.`) and a prompt
  (`Describe what the AI should do each run.`), then `updateTask(id, values)`
  while editing or `createTask({ ...values, enabled: true })`; the button reads
  `Saving...` / `Creating...` meanwhile. Values: `{ name, requestPrompt,
  responsePrompt, webhookUrl, repeatInterval }`, trimmed. A failure keeps the
  form open with the handler's error or `Could not save the task.` /
  `Could not create the task.`
- `isOpen`, `editingId` getters.

## Globals

None (works inside the root element).
