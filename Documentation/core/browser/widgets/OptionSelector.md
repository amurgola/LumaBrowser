# OptionSelector

`core/browser/widgets/OptionSelector.js`

`select_option` end to end, behind [WidgetDriver](WidgetDriver.md)`.selectOption`.

## Methods

- `new OptionSelector(wc).execute({ ref?, selector?, option, multiple? })`. `option` is a string or an
  array (blank entries dropped). Needs an option and a ref or selector.
  - **native** `<select>`: every wanted option is matched with [OptionMatcher](OptionMatcher.md); a miss
    lists the available options and changes nothing; several options on a single select are refused.
    Applied with the native setter and read back: `{ kind: 'native', selected, value, verified }`, with
    a note when the page reverted it. `multiple: true` keeps the current selection.
  - **listbox / combobox**: per wanted option, list the open popup (or open the combobox and wait),
    find the option ([DropdownOptions](DropdownOptions.md)), and for an editable combobox without an
    exact match type the text as a filter. Options the page renders with no role are picked with Enter.
    No match presses Escape and lists what exists (with a hint when no popup opened). After all picks
    the widget's display is read back: `{ kind, selected, display, method, verified, filtered?, note? }`.
    A failure after some picks names the ones already selected.
