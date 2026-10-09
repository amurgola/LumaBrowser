# OptionMatcher

`core/browser/widgets/OptionMatcher.js`

Decides which option of a select, listbox or combobox the caller meant.

## Methods

- `OptionMatcher.pickOption(options, wanted)` returns `{ option, score }` for the best match among
  `[{ index, label, value?, disabled? }]`, or `null`. Disabled options never win; ties go to the
  earlier option.
- `OptionMatcher.describeOptions(options, limit = 20)` returns the first `limit` non-blank labels,
  quoted and truncated to 60 chars, plus `(+N more)`; `(no options found)` when empty. Used in
  "no match" errors the model can act on.
- `OptionMatcher.normalize(text)` lowercases, strips diacritics and quote characters, and collapses
  whitespace. WidgetDriver also uses it to compare a widget's displayed value with the chosen labels.

## Scoring

Exact label (100) beats exact value (95) beats prefix (80) beats substring (65) beats the wanted
text containing a label of 3+ chars (55) beats token overlap (up to 50, needs half the wanted tokens).
Prefix and substring lose up to 10 points as the label grows longer than the wanted text, so "US"
picks "US" over "USA" and "Russia".

## Why in Node

The page scripts only report (option labels, values) and act (click option #3). The judgement call
between those steps lives here so unit tests can pin it without a browser.
