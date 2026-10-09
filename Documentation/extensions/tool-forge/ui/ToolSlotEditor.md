# ToolSlotEditor

`extensions/tool-forge/ui/ToolSlotEditor.js`

The editable config-slot rows of the definition section.

## Methods

- `new ToolSlotEditor(container, slots)`: `slots` is edited in place.
- `render()`: one row per slot (key, trimmed on input; label; required and
  secret checkboxes; a remove button), or "No config slots.".
- `add()`: appends a blank slot and re-renders, leaving the rest of the form alone.
