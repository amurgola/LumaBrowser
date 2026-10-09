# MyToolsTab

`extensions/tool-forge/ui/MyToolsTab.js`

The "My Tools" tab: the tools the AI built, import/export, and a full-pane edit
view with Monaco. Editing a published tool reverts it to a draft, so the edit
view carries Test and Publish (the test-before-publish gate).

## Methods

- `new MyToolsTab(el, api)`, `mount()`: injects `<link id="tf-css">`, adds
  `luma-setup`, refreshes.
- `refresh()`: `list` -> tools and `encryptionAvailable`; a failure shows
  "Failed to load tools: <message>".
- `openEditor(name)`: `get`; working slot copy; Publish enabled when
  `lastTest.ok`; mounts the editor. `closeEditor()` disposes it and refreshes.
- `saveTool()`: saves a draft -> "Saved as a draft (vN). Test it, then publish.";
  a refused save lists `L<line>: <message>` diagnostics.
- `testTool()`: parses the test args (invalid JSON stops with a notice),
  saves first so the test runs the code on screen, runs `test`; a pass unlocks
  Publish and shows the result truncated to 600 characters.
- `publishTool()`, `saveSettings()` (only filled slots; reloads the config
  status), `exportTool(name)`, `importTool()` (warnings make a warn notice),
  `deleteTool(name)` (confirmed with [Dialogs](../../../core/llm-server/ui/js/dialogs/Dialogs.md)).

Every in-editor action re-renders through one path that captures the live code
first and re-mounts Monaco, so a notice never blanks the editor or loses edits.

## Globals

Reads `document`; Dialogs reads `window.LumaModal`.
