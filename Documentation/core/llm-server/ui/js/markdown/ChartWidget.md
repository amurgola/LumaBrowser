# ChartWidget

`core/llm-server/ui/js/markdown/ChartWidget.js`

The ```` ```chart ```` fence: a small JSON spec rendered as an inline SVG column
or line chart, built as an HTML string so every surface that renders chat
markdown gets it.

```json
{ "type": "bar", "title": "Revenue by quarter", "unit": "$",
  "labels": ["Q1", "Q2"], "series": [{ "name": "2025", "data": [12, 18] }] }
```

`"data": [...]` stands for a single series. Up to 8 series and 60 points;
non-numbers become gaps. `type` other than `line` is `bar`.

Built to the dataviz method: one axis from zero (or the negative minimum) with
clean ticks (1, 2, 2.5, 5 steps) and compact labels (12.9K, $4.2M, 12.5%);
columns at most 24 px thick with a 2 px gap and a 4 px rounded data end, square
at the baseline; 2 px lines with 8 px dots ringed in the surface color;
hairline solid gridlines; category labels thinned so they never collide. Series
colors follow a fixed categorical order (never cycled) validated against the
chat's dark surfaces (`#0f1626`, `#141b2c`: adjacent-pair CVD and normal-vision
separation, contrast); each color is `var(--cm-series-<n>, <hex>)`, so a
surface without chat.css still draws it. From two series a legend shows a
swatch beside each name; text never wears a series color. Every mark carries a
native tooltip (`<title>`), the SVG has an `aria-label`, and a collapsed "Show
data" table holds the numbers. Every string is escaped.

## Methods

- `ChartWidget.html(raw)`: the widget HTML, or null when `raw` is not a usable
  spec (the renderer then keeps the code block).
- `ChartWidget.parse(raw)`: `{ type, title, unit, labels, series }` or null.
- `ChartWidget.ticks(lo, hi)`, `ChartWidget.format(value, unit)`,
  `ChartWidget.color(index)`.

## Globals

None.
