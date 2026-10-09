# PageSourceScripts

`core/browser/tab-manager/PageSourceScripts.js`

The in-page scripts behind `getTabSource`, one per extraction type.

## Methods

- `PageSourceScripts.forType(type)`: the script for `type`, falling back to `clean` for unknown types
  (including Object prototype names).
- `BY_TYPE`: `structural` ([StructuralSummaryScript](../extraction/StructuralSummaryScript.md)), `semanticTree`
  ([SemanticTreeScript](../extraction/SemanticTreeScript.md)), `full`, `markdown`, `text`, `clean`, `minimal`,
  `analyze` ([PageAnalysisScript](PageAnalysisScript.md)).
- Constants: `DEFAULT_TYPE` (`clean`), `FULL`, `MARKDOWN`, `TEXT`, `CLEAN`, `MINIMAL`.

## Why

`markdown` shares the in-page step with `full` (the live HTML, `<body>` preferred to drop `<head>` noise); [PageSource](PageSource.md) converts it Node-side.
