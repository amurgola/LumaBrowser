# OverlayInput

`core/browser/ui/overlay/OverlayInput.js`

## Methods

- `new OverlayInput(root, api, win)`, `attach()`:
  - mousedown on `[data-bd-action]` (prevented, so it lands before the URL
    bar's blur) -> `sendAction({ action, index, id, url })`;
  - mousemove over `[data-bd-index]` -> `sendHover({ index })`;
  - body enter/leave while a `.notification-log` is shown -> `sendHover({ hovering })`;
  - Ctrl/Cmd+C with a selection -> `execCommand('copy')`.
