# LayoutSaver

`core/dashboard/ui/js/LayoutSaver.js`

Persists the grid geometry through `dashboardAPI.layout.set`.

## Methods

- `schedule()`: debounced, `DEBOUNCE_MS` 400.
- `flush()`: cancels the pending save and saves now (leaving the tab).
- `save()`: nothing before the grid exists; failures are swallowed.
