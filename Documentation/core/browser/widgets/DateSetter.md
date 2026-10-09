# DateSetter

`core/browser/widgets/DateSetter.js`

`set_date` end to end, behind [WidgetDriver](WidgetDriver.md)`.setDate`.

## Methods

- `new DateSetter(wc).execute({ ref?, selector?, date })`. `date` is ISO (`yyyy-mm-dd`, `THH:MM`
  allowed); a malformed date is refused before the page is touched.
  - a non-input target or a read-only field: an error pointing at the calendar route (`CALENDAR_HINT`);
  - a native `date` / `datetime-local` / `month` / `week` input: the native value is set and must read
    back unchanged, else the error names the allowed `min`/`max` range;
  - a text field: the format comes from [DateFormatter](DateFormatter.md)`.detectDateFormat`; first a
    framework-safe value set (`method: 'value'`), then trusted click, clear and keystrokes
    (`method: 'keys'`). Masks re-punctuate, so the field is compared by digits. Data:
    `{ kind: 'text', format, formatSource, typed, value, method, verified }`.
