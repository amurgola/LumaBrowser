# ToolCodeEditor

`extensions/tool-forge/ui/ToolCodeEditor.js`

The edit view's Monaco editor.

## Methods

- `mount(host, tool, stillWanted)`: awaits
  [MonacoLoader](../../../core/llm-server/ui/js/monaco/MonacoLoader.md)`.ensureLoaded()`;
  a load failure shows "Code editor unavailable."; returns when the user left
  the edit view (`stillWanted()` false) or the host is detached; else disposes
  any previous editor and creates one (`OPTIONS`: javascript, `luma-dark`,
  automatic layout, 12.5 px, no minimap) with the tool's code and registers
  [ToolCompletions](ToolCompletions.md).
- `value()` (null without an editor), `isMounted()`, `dispose()`.

## Globals

MonacoLoader reads `window.monaco` and Monaco's AMD `require`.
