# IntervalPicker

`extensions/ui-kit/ui/IntervalPicker.js`

The `.luma-interval` schedule control: a preset select with a Custom option that
reveals a minutes field.

## Methods

- `IntervalPicker.markup(id, selectedMs)`: the control's HTML, with inner ids
  `<id>-select` and `<id>-custom`. A preset value selects it; another non-zero
  value selects Custom with its minutes; nothing selects every hour. Ids are
  escaped.
- `IntervalPicker.bind(root)` wires the custom toggle and returns `{ get(),
  set(ms) }` in milliseconds (`get` of Custom is at least one minute; `set` of a
  non-preset switches to Custom, `0` meaning 10 minutes). A missing root returns
  a stub reading one hour.
- `IntervalPicker.format(ms)`: `'every 5 minutes'` for presets, else
  `'every 45s'`, `'every 2 min'`, `'every 1.5 h'`; `''` for none.
- `IntervalPicker.PRESETS` (every minute to every 24 hours), `DEFAULT_MS` (1 h).

## Globals

None.
