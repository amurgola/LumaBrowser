# LumaExtension

`ide/vscode/src/LumaExtension.js`

Activates the extension: one session per window on the first workspace folder, the view, the status bar, the commands and the editor hooks.

## Methods

- `new LumaExtension(context, connectLib)`; `activate()`: without `connectLib` it shows how to build and stops.
  Subscribes the view provider (`retainContextWhenHidden`), the `luma-before` content provider, configuration
  changes (approval re-hello, otherwise a state push), workspace trust (connect) and folder changes (new session).
- `LumaExtension.RESUME_KEY` (`luma.conversationId` in workspaceState).
