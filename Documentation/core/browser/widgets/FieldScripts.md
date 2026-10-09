# FieldScripts

`core/browser/widgets/FieldScripts.js`

In-page steps of `set_date` and `set_slider`, each wrapped by [WidgetScript](WidgetScript.md).

## Methods

- `inspectDateScript({ ref, selector })`: finds the input (target, label
  control, or the one inside a wrapper) and reports `type`, `readOnly`,
  `disabled`, `value`, format `hints` (placeholder, aria, title, data-format /
  mask attributes, label, aria-describedby text), `min`, `max`, page `lang`,
  and its point. A non-input target reports `isInput: false` with its tag, role and text.
- `inspectSliderScript({ ref, selector })`: an `input[type=range]` reports
  `min`, `max`, `step` (`any` -> 0), `value`; else an ARIA `role=slider`
  reports `min`, `max`, `now`, `orientation`, the thumb point and the `track`
  (nearest ancestor at least 3x the thumb along the axis).
- `setValueScript(value, { blur })`: focus, native setter, bubbling input +
  change, optional blur (date pickers commit on blur); returns the value read back.
- `readValueScript()`: `{ value, now, valueText }` of the marked target.
- `focusTargetScript({ select })`: focus (and select the text) for trusted typing.
- `blurTargetScript()`: commits masked and picker-backed fields.
