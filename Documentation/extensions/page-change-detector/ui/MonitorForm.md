# MonitorForm

`extensions/page-change-detector/ui/MonitorForm.js`

The Page Monitors panel's create-and-edit form.

## Methods

- `new MonitorForm(root, invoke, onSaved)`: finds the `pcd-bar-*` elements in
  the panel, mounts an IntervalPicker (`pcd-bar-interval`, 5 min) in
  `#pcd-bar-interval-mount`, and wires "+ New monitor" (toggles the form),
  Cancel and Create/Save.
- `open(monitor)` / `close()`: show blank (`New monitor`, `Create`) or
  filled (`Edit monitor`, `Save`); the new button reads `Cancel` while open.
- `closeIfEditing(id)`, `isOpen()`, `editingId`, `setError(msg)`, `read()`.
- `create()`: needs a name (`Give the monitor a name.`) and a URL
  (`Enter the page URL to watch.`); prefixes `https://` when the URL does not
  start with `http`; sends `create` with `enabled: true`.
- `save()`: needs a name; sends `update(id, values)` with an empty URL as
  undefined.

Both show `Creating...` / `Saving...` on a disabled button, close and call
`onSaved` on success, and otherwise show the handler error or
`Could not create the monitor.` / `Could not save the monitor.`

## Globals

Reads `document` only.
