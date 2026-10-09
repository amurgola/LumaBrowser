# AutoImageChoice

`core/llm-server/ui/js/setup/AutoImageChoice.js`

The plan screen's one image choice, shared by both setup front doors.

## Methods

- `AutoImageChoice.mount(host, { scan, plan, className?, onChange })` renders a
  label and select into `host`: "Download the recommended model: <label>
  (<size>)" plus "Use <name> · <arch> · <source> · <size> · no download" for up
  to 40 [fitting checkpoints](ExistingImagePlan.md); the plan's linked
  checkpoint is pre-selected. A change calls `onChange(found)` or
  `onChange(null)` for the recommendation. Clears `host` when nothing fits or
  the plan has no image leg; does nothing without a host. All interpolated text
  is escaped with HtmlEscaper.

## Globals

None (writes into `host`).
