# CodeBuildPanel

`extensions/code-mode/ui/CodeBuildPanel.js`

Code mode's build playground (`.cm-code-panel`), mounted on `<body>` so
`position: fixed` anchors to the viewport, and tagged `data-cm-overlay` so the
shared chat CSS hides it on the Setup tab.

## Methods

- `setBuild(build)` / `build`: the latest build snapshot
  (`{ id, status, installedId, files }`) or null.
- `setLanes(lanes)`: the running batch's lanes, or null.
- `ensure()`: creates the hidden panel once (again if it was detached).
- `render()`: lanes take over the panel while any exist
  ([CodePanelMarkup](CodePanelMarkup.md)`.batchHtml`); otherwise the build's
  files (`buildHtml`); with no files it clears. Does nothing before `ensure()`.
- `clear()`: hides and empties the panel.
- `element`: the panel, or null.

## Globals

Reads `document`.
