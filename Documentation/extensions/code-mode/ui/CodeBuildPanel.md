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

## Position

The stylesheet puts the panel in the bottom-right corner (`bottom: 96px`). Whenever it is
shown it is moved to sit `GAP_PX` (12) above the chat's bottom bar (`.cm-composer-bar`),
and a ResizeObserver keeps it there as the bar grows or shrinks. The bar's height is not
fixed: attachments, the plan panel and queued messages stack over the composer, and a
panel at a fixed offset ended up on top of them. Without the bar, with a hidden bar or
without ResizeObserver the stylesheet's offset holds (or the one last set).

## Globals

Reads `document`.
