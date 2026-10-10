# LiteModelPicker

`extensions/ai-chat/ui/lite-panel/LiteModelPicker.js`

Searchable model picker for the browser chat panel. Filters labels and refs
case-insensitively; every whitespace-separated query term must match.
Search does not change the selected model until an option is chosen.

## Methods

- `new LiteModelPicker(button, onPick)`: attaches a search combobox and listbox
  popup to the trigger. Calls `onPick(ref)` only after selection.
- `render(models, selectedRef)`: refreshes the model list and selected label;
  disables the trigger with "No model configured" for an empty list.
- `open()`: clears the query, shows all models, highlights the selection and
  focuses search. Positions the popup above or below to fit the viewport.
- `close(restoreFocus = false)`: dismisses without changing selection.
- `destroy()`: removes the popup and external listeners.

Arrow keys move the active option, Enter selects, Escape cancels and returns
focus to the trigger without closing chat. Tab or clicking outside dismisses.
The popup shows a result count or "No matching models". Model labels are text,
not HTML. A list refresh preserves the query while the popup is open.
