# PlacementControls

`core/llm-server/ui/js/setup-ui/advanced/PlacementControls.js`

The control row: save the layout with auto-start and auto-stop, start or stop every server, reset to automatic.

## Methods

- `render(body)`, `save(row)`, `autoArrange()`, `lifecycle('start'|'stop')` (re-reads the snapshot 1.5 s later).
- After a save the snapshot is read again, so the canvas shows which running models the new layout has not moved
  yet ([PlacementStaleNotice](PlacementStaleNotice.md)); the status line then reads "Saved." plus a pointer to
  that notice.

## Globals

None.
