# DashboardMode

`core/dashboard/ui/js/DashboardMode.js`

Live and Edit modes, and the empty-grid hint (the texts name both live modules
and extension widgets).

## Methods

- `set(edit)`: `#dbRoot.db-edit`, the dock shown in Edit, the pill's `.active`
  segment, the subtitle (Edit only), `grid.setStatic(!edit)`, a dock refresh in
  Edit, then `syncEmpty`.
- `syncEmpty()`: `#dbEmpty` hidden when the grid has nodes; the hint text per mode.
- `isEdit()`.
