# ListCollector

`core/browser/widgets/ListCollector.js`

`collect_list` end to end, behind [WidgetDriver](WidgetDriver.md)`.collectList`.

## Methods

- `new ListCollector(wc).execute({ itemSelector, childSelectors?, maxItems = 200 (max 2000),
  maxScrolls = 30 (max 200), settleMs = 1500 (min 200) })`. No matching items is an error. Then, until
  stopped: at the end of what is loaded, click this list's "Load more" (trusted, or page-world when
  covered); otherwise scroll its container. After each move, poll every 150 ms and move on as soon as a
  new row appears; short of the end wait at most 300 ms, at the end the full settle window. Two idle
  rounds at the end stop the walk.
- Data: `{ items, count, scrolls, stoppedBecause, mode, container, loadMoreClicks }`. `stoppedBecause`
  is `maxItems`, `maxScrolls`, `endOfList` or `noNewItems`; `mode` is `virtualized` when rendered rows
  disappeared, else `append` ([ListRowLedger](ListRowLedger.md)).
