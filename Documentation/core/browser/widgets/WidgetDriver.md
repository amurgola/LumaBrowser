# WidgetDriver

`core/browser/widgets/WidgetDriver.js`

The browser agent's widget primitives. Filter and sort controls (dropdowns, date and numeric ranges)
are where web agents fail most; each primitive drives one widget kind end to end and reads the result
back, so the model gets "selected: Canada" or the options that do exist, never a silent no-op.

## Methods

All take the tab's webContents and answer `{ success, data }` or `{ success: false, error }`.

- `WidgetDriver.selectOption(wc, { ref?, selector?, option, multiple? })`: [OptionSelector](OptionSelector.md).
- `WidgetDriver.setDate(wc, { ref?, selector?, date })`: [DateSetter](DateSetter.md).
- `WidgetDriver.setSlider(wc, { ref?, selector?, value })`: [SliderSetter](SliderSetter.md).
- `WidgetDriver.collectList(wc, { itemSelector, childSelectors?, maxItems?, maxScrolls?, settleMs? })`:
  [ListCollector](ListCollector.md).

Page steps come from [SelectScripts](SelectScripts.md), [FieldScripts](FieldScripts.md) and
[ListScripts](ListScripts.md), run by [WidgetPage](WidgetPage.md); decisions from
[OptionMatcher](OptionMatcher.md), [DateFormatter](DateFormatter.md), [SliderValue](SliderValue.md);
input from [InputDriver](../InputDriver.md) and [KeyInput](KeyInput.md).
