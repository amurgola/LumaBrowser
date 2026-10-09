# SelectScripts

`core/browser/widgets/SelectScripts.js`

In-page steps of `select_option`, each wrapped by [WidgetScript](WidgetScript.md).

## Methods

- `inspectSelectScript({ ref, selector })`: classifies the target as `native`
  (returns its options, up to 1000, with optgroup-disabled honoured),
  `listbox` (options already on screen), or `combobox` (point, editable input,
  expanded state, display text). Marks the trigger, its text input, and every
  popup already open. A single option as the target is refused with guidance.
- `applyNativeSelectScript(indices, keepExisting)`: sets a native select via
  the native setter, fires bubbling input + change, returns `{ selected, value }`.
- `collectOptionsScript()`: the opened dropdown's options, searching the
  trigger, its `aria-controls` / `aria-owns` popups, then newly visible popups
  (portals), then any visible option; nested matches collapse to the outer;
  up to 500, each tagged `data-luma-opt="N"`.
- `scrollOptionsScript({ toTop })`: scrolls the options' container one page
  (virtualized dropdowns render only nearby rows).
- `optionPointScript(index)`: centre point of option N.
- `syntheticOptionClickScript(index)`: page-world pointer/mouse press sequence
  for an option the trusted pointer cannot reach.
- `typeFilterScript(text)`: React-safe filter text into the combobox input.
- `readSelectionScript()`: what the widget shows now (`display`, `expanded`, `selectedOptions`).
- `POPUP_SEL`, `OPTION_SEL`: ARIA roles plus the popup/option classes of Ant
  Design, MUI, Angular CDK, React Select, Radix, Select2, Chosen and cmdk.
