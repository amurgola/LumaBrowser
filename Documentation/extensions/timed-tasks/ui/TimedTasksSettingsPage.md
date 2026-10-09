# TimedTasksSettingsPage

`extensions/timed-tasks/ui/TimedTasksSettingsPage.js`

The Timed Tasks settings page (`settings.html`): a task count, a button that
opens the panel, and the model runs use. Tasks have no model of their own:
runs use the AI Chat Navigator model.

## Methods

- `new TimedTasksSettingsPage(root, panelContainer)`: either may be null. Wires
  `#ext-tt-openPanelBtn`: closes `#settingsModal` and clicks the
  `.toolbar-btn[data-extension-id="timed-tasks"]` unless the panel is already
  showing.
- `renderSummary(tasks)`: `No tasks yet.` or `3 tasks, 2 active.`
- `loadModelLabel()`: reads the `ai-chat.navigator` slot through
  `window.llmSlotAPI`; shows the model list's label, else the model id,
  `App default (active provider)` with no model set, or `Unavailable` on error.

## Globals

Reads `window.llmSlotAPI` (`getSlotConfig`, `getAllAvailableModels`) and
`document` (`#settingsModal`, the toolbar button).
