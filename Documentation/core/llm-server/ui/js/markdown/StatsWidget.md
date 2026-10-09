# StatsWidget

`core/llm-server/ui/js/markdown/StatsWidget.js`

The ```` ```stats ```` fence: a row of up to four stat tiles for replies that lead
with headline numbers.

```json
[{ "label": "Revenue", "value": "$4.2M", "delta": "+12% vs Q2", "good": true }]
```

Tiles without a value are dropped; an object with a `stats` array is accepted.
The delta shows an up or down arrow from its sign plus its text, and is colored
good or bad only when `good` says which (never color alone). Labels, values and
deltas are length-capped and escaped.

## Methods

- `StatsWidget.html(raw)`: the widget HTML, or null (a code block).
- `StatsWidget.parse(raw)`: `[{ label, value, delta, good }]` or null.

## Globals

None.
