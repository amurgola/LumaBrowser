# TriggerSourceRows

`core/llm-server/ui/js/triggers/TriggerSourceRows.js`

The card's event-source rows: webhook URLs (primary plus "All URLs"),
watched folder and match, Page Watcher page and monitor, notification tab and
site, the waiting-for-a-sample hints, and a webhook's secret status and entry.
Every interpolated value goes through `HtmlEscaper.escape`.

## Methods

- `build(trigger, state)`.
