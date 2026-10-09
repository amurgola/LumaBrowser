# MonacoEditorHost

`core/llm-server/ui/js/code/MonacoEditorHost.js`

Creates the Monaco editor once through [MonacoLoader](../monaco/MonacoLoader.md),
with Ctrl+S and the IDE plugins' commands: Ask Luma About Selection
(Ctrl+Alt+L) and Add Selection to Chat (Ctrl+Alt+Shift+L, needs a selection).

## Methods

- `new MonacoEditorHost(host, { onSave, onAsk, onAddSelection }, loader?)`; `ensure()`; fields `monaco`, `editor`.
